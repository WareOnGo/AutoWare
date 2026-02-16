import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface Coordinates {
  lat: number;
  lng: number;
}

export const extractCoordinatesFromUrl = async (url: string): Promise<Coordinates | null> => {
  let finalUrl = url;
  let htmlContent: string | null = null;

  console.log('Processing URL:', url);

  // If it's a shortened URL (goo.gl, maps.app.goo.gl, or share.google), resolve it first
  if (url.includes('goo.gl') || url.includes('share.google')) {
    try {
      // First attempt: Follow redirects with full browser headers
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cookie': 'CONSENT=YES+; SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpXzIwMjMwMTEwLjA3X3AxLjhmGgJlbiACGgYIgLCjnwY;',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
      });
      finalUrl = response.url;
      console.log('Resolved to:', finalUrl);

      // If we got a search URL instead of a place URL, try to extract from HTML
      if (finalUrl.includes('google.com/maps?q=') || finalUrl.includes('google.com/search')) {
        const html = await response.text();

        // Look for meta refresh or canonical URL that might have the actual place URL
        const metaRefresh = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"]*url=([^"']+)["']/i);
        if (metaRefresh) {
          finalUrl = metaRefresh[1];
          console.log('Found meta refresh URL:', finalUrl);
        }

        // Look for canonical link
        const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
        if (canonical) {
          finalUrl = canonical[1];
          console.log('Found canonical URL:', finalUrl);
        }

        // Look for any maps/place URL in the HTML
        const placeUrl = html.match(/https:\/\/www\.google\.com\/maps\/place\/[^"'\s]+@[\d.]+,[\d.]+[^"'\s]*/);
        if (placeUrl) {
          finalUrl = placeUrl[0];
          console.log('Found place URL in HTML:', finalUrl);
        }
      }
    } catch (error) {
      console.error('Failed to resolve shortened URL:', error);
      return null;
    }
  }

  // Pattern 1: @lat,lng,zoom format (viewport center - most common in shared links)
  const pattern1 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match1 = finalUrl.match(pattern1);
  if (match1) {
    console.log('Found coordinates in @ format (viewport)');
    return {
      lat: parseFloat(match1[1]),
      lng: parseFloat(match1[2]),
    };
  }

  // Pattern 2: /search/lat,lng format (from shortened URLs)
  const pattern2 = /\/search\/(-?\d+\.?\d*),\s*\+?(-?\d+\.?\d*)/;
  const match2 = finalUrl.match(pattern2);
  if (match2) {
    console.log('Found coordinates in /search/ format');
    return {
      lat: parseFloat(match2[1]),
      lng: parseFloat(match2[2]),
    };
  }

  // Pattern 3: !3d!4d format (ACTUAL PIN LOCATION - most accurate for place URLs)
  // This is buried in the data= parameter and represents the actual place coordinates
  const pattern3 = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
  const match3 = finalUrl.match(pattern3);
  if (match3) {
    console.log('Found coordinates in !3d!4d format (pin location)');
    return {
      lat: parseFloat(match3[1]),
      lng: parseFloat(match3[2]),
    };
  }

  // Pattern 4: ll=lat,lng format
  const pattern4 = /ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match4 = finalUrl.match(pattern4);
  if (match4) {
    console.log('Found coordinates in ll= format');
    return {
      lat: parseFloat(match4[1]),
      lng: parseFloat(match4[2]),
    };
  }

  // Pattern 5: q=lat,lng format
  const pattern5 = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match5 = finalUrl.match(pattern5);
  if (match5) {
    console.log('Found coordinates in q= format');
    return {
      lat: parseFloat(match5[1]),
      lng: parseFloat(match5[2]),
    };
  }

  // Pattern 5: DMS format (Degrees Minutes Seconds) - e.g., 19°51'58.8"N+75°28'24.0"E
  const dmsPattern = /(\d+)%C2%B0(\d+)'([\d.]+)%22([NS])\+(\d+)%C2%B0(\d+)'([\d.]+)%22([EW])/;
  const dmsMatch = finalUrl.match(dmsPattern);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const latDir = dmsMatch[4];
    const lngDeg = parseFloat(dmsMatch[5]);
    const lngMin = parseFloat(dmsMatch[6]);
    const lngSec = parseFloat(dmsMatch[7]);
    const lngDir = dmsMatch[8];

    // Convert DMS to decimal degrees
    let lat = latDeg + latMin / 60 + latSec / 3600;
    let lng = lngDeg + lngMin / 60 + lngSec / 3600;

    // Apply direction (S and W are negative)
    if (latDir === 'S') lat = -lat;
    if (lngDir === 'W') lng = -lng;

    console.log('Found coordinates in DMS format (degrees/minutes/seconds)');
    return { lat, lng };
  }

  // Pattern 6: Extract from og:image meta tag (social preview trick) - DISABLED
  // This method is unreliable as Google may serve cached/incorrect preview images
  // if (!htmlContent && (finalUrl.includes('google.com/maps') || finalUrl.includes('google.com/search'))) {
  //   try {
  //     const response = await fetch(finalUrl, {
  //       headers: {
  //         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  //       },
  //     });
  //     htmlContent = await response.text();
  //   } catch (error) {
  //     console.error('Failed to fetch HTML for og:image extraction:', error);
  //   }
  // }

  // if (htmlContent) {
  //   const coords = extractFromOgImage(htmlContent);
  //   if (coords) {
  //     console.log('Found coordinates in og:image meta tag (social preview):', coords);
  //     return coords;
  //   }
  // }

  // Pattern 7: Extract place name/address and geocode (LAST RESORT - less accurate)
  // Try /place/ URLs
  const placePattern = /\/place\/([^\/]+)/;
  const placeMatch = finalUrl.match(placePattern);
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    console.warn('No coordinates found in URL, falling back to geocoding (may be inaccurate):', placeName);
    return await geocodePlaceName(placeName);
  }

  // Try ?q= query parameter URLs
  const queryPattern = /[?&]q=([^&]+)/;
  const queryMatch = finalUrl.match(queryPattern);
  if (queryMatch) {
    const placeName = decodeURIComponent(queryMatch[1].replace(/\+/g, ' '));
    console.warn('No coordinates found in URL, falling back to geocoding from query (may be inaccurate):', placeName);
    return await geocodePlaceName(placeName);
  }

  console.log('No coordinates found in URL');
  return null;
};

function extractFromOgImage(html: string): Coordinates | null {
  try {
    // Look for og:image meta tag - try multiple patterns
    let ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

    // Also try content first, then property (some sites do it this way)
    if (!ogImageMatch) {
      ogImageMatch = html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    }

    // Try itemprop="image" as fallback
    if (!ogImageMatch) {
      ogImageMatch = html.match(/<meta\s+(?:content|itemprop)=["']([^"']+)["'].*?itemprop=["']image["']/i);
    }

    if (!ogImageMatch) {
      console.log('No og:image meta tag found');
      return null;
    }

    const imageUrl = ogImageMatch[1];
    console.log('Found og:image URL:', imageUrl.substring(0, 200));

    // Extract center= parameter from the static map URL
    // Format: center=lat,lng or center=lat%2Clng (URL encoded comma)
    // Try URL-encoded version first (more common)
    let centerMatch = imageUrl.match(/center=(-?\d+\.?\d*)%2C(-?\d+\.?\d*)/i);

    // Try non-encoded version
    if (!centerMatch) {
      centerMatch = imageUrl.match(/center=(-?\d+\.?\d*),(-?\d+\.?\d*)/i);
    }

    if (centerMatch) {
      const lat = parseFloat(centerMatch[1]);
      const lng = parseFloat(centerMatch[2]);

      console.log('Extracted from og:image - lat:', lat, 'lng:', lng);

      // Validate coordinates are in valid range
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      } else {
        console.log('Coordinates out of valid range');
      }
    } else {
      console.log('No center= parameter found in og:image URL');
    }
  } catch (error) {
    console.error('Failed to extract coordinates from og:image:', error);
  }

  return null;
}

async function geocodePlaceName(placeName: string): Promise<Coordinates | null> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('MAPBOX_ACCESS_TOKEN not configured');
    return null;
  }

  try {
    // Clean up the place name - extract just the main location and city/region
    // Remove parentheses content and extra details
    let cleanedName = placeName.replace(/\([^)]*\)/g, '').trim();

    // If it contains commas, it's likely an address - take the first part and last 2-3 parts
    const parts = cleanedName.split(',').map(p => p.trim()).filter(p => p);
    if (parts.length > 3) {
      // Take first part (place name) and last 2 parts (city, state/country)
      cleanedName = [parts[0], ...parts.slice(-2)].join(', ');
    }

    // Use Mapbox Geocoding API
    const encodedPlace = encodeURIComponent(cleanedName);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedPlace}.json?access_token=${accessToken}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Mapbox returns [longitude, latitude] in GeoJSON format
      const [longitude, latitude] = data.features[0].center;
      return { lat: latitude, lng: longitude };
    }

    // If that didn't work, try with just the last 2-3 parts (location info)
    if (parts.length > 1) {
      const locationOnly = parts.slice(-3).join(', ');
      const encodedLocation = encodeURIComponent(locationOnly);
      const url2 = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${accessToken}&limit=1`;
      const response2 = await fetch(url2);
      const data2 = await response2.json();

      if (data2.features && data2.features.length > 0) {
        const [longitude, latitude] = data2.features[0].center;
        return { lat: latitude, lng: longitude };
      }
    }
  } catch (error) {
    console.error('Failed to geocode place name:', error);
  }

  return null;
}

export const generateSatelliteImage = async (
  compositionId: string,
  coordinates: Coordinates,
  options: {
    zoom?: number;
    width?: number;
    height?: number;
    style?: 'satellite-streets-v12' | 'satellite-v9' | 'streets-v12';
  } = {}
): Promise<{ imageUrl: string; key: string; coordinates: Coordinates }> => {
  const {
    zoom = 16,
    width = 1280,
    height = 720,
    style = 'satellite-streets-v12', // satellite with labels
  } = options;

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN not configured');
  }

  // Build Mapbox Static Images API URL
  // Format: /styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom}/{width}x{height}
  // Using @2x for retina/high-DPI displays (makes labels larger and sharper)
  const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/pin-s+ff0000(${coordinates.lng},${coordinates.lat})/${coordinates.lng},${coordinates.lat},${zoom}/${width}x${height}@2x?access_token=${accessToken}`;

  // Fetch the image
  const response = await fetch(mapboxUrl);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch map image: ${response.statusText} - ${errorText}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());

  // Generate unique key for R2
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const key = `compositions/${compositionId}/image/${timestamp}-${randomString}-satellite.jpg`;

  // Upload to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
    })
  );

  const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return {
    imageUrl,
    key,
    coordinates,
  };
};

export const generateSatelliteImageFromUrl = async (
  compositionId: string,
  googleMapsUrl: string,
  options?: {
    zoom?: number;
    width?: number;
    height?: number;
    style?: 'satellite-streets-v12' | 'satellite-v9' | 'streets-v12';
  }
): Promise<{ imageUrl: string; key: string; coordinates: Coordinates }> => {
  const coordinates = await extractCoordinatesFromUrl(googleMapsUrl);

  if (!coordinates) {
    throw new Error(
      'Could not extract coordinates from Google Maps URL. ' +
      'Please use a URL with coordinates (right-click on map > "What\'s here?" or share with coordinates visible in URL like @lat,lng,zoom)'
    );
  }

  return generateSatelliteImage(compositionId, coordinates, options);
};
