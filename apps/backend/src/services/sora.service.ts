import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';
import * as crypto from 'crypto';
const sharp = require('sharp');

// Initialize R2 client (reusing pattern from r2.service.ts)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const SORA_TIMEOUT_MS = parseInt(process.env.SORA_TIMEOUT_MS || '300000', 10);
const SORA_DEFAULT_DURATION = parseInt(process.env.SORA_DEFAULT_DURATION || '5', 10);

export interface SoraVideoRequest {
  image: string;
  prompt: string;
  compositionId?: string;
}

export interface SoraVideoResult {
  videoUrl: string;
  key: string;
  durationInSeconds: number;
}

/**
 * Decodes a base64 string to a Buffer
 * Supports both data URI format and raw base64
 */
function decodeBase64Image(base64String: string): Buffer {
  try {
    // Remove data URI prefix if present (e.g., "data:image/png;base64,")
    const base64Data = base64String.includes(',') 
      ? base64String.split(',')[1] 
      : base64String;
    
    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    throw new Error('Invalid base64 encoding');
  }
}

/**
 * Validates image format by checking magic bytes
 * Supports PNG and JPEG formats
 */
function validateImageFormat(buffer: Buffer): void {
  if (buffer.length < 4) {
    throw new Error('Invalid image: file too small');
  }

  // Check PNG magic bytes: 89 50 4E 47
  const isPNG = buffer[0] === 0x89 && 
                buffer[1] === 0x50 && 
                buffer[2] === 0x4E && 
                buffer[3] === 0x47;

  // Check JPEG magic bytes: FF D8 FF
  const isJPEG = buffer[0] === 0xFF && 
                 buffer[1] === 0xD8 && 
                 buffer[2] === 0xFF;

  if (!isPNG && !isJPEG) {
    throw new Error('Unsupported image format. Only PNG and JPEG are supported');
  }
}

/**
 * Calls Sora API to generate video from image and prompt
 */
async function generateVideoWithSora(imageBuffer: Buffer, prompt: string): Promise<Buffer> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SORA_TIMEOUT_MS);

    try {
      // Convert buffer to base64 for OpenAI API
      const base64Image = imageBuffer.toString('base64');
      
      // Call Sora API (using OpenAI's video generation endpoint)
      // Note: This is a placeholder for the actual Sora API call
      // The actual implementation will depend on OpenAI's Sora API structure
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview', // Placeholder - will be replaced with actual Sora model
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate a video based on this prompt: ${prompt}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      }, {
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);

      // For now, return a placeholder buffer
      // In production, this would download the actual video from Sora's response
      throw new Error('Sora API integration pending - actual video generation not yet available');
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Video generation timed out');
      }
      
      // Handle OpenAI API errors
      if (error.status === 401) {
        throw new Error('OpenAI API authentication failed');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded');
      } else if (error.status >= 500) {
        throw new Error('Sora API unavailable');
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Sora API error:', error.message);
    throw error;
  }
}

/**
 * Uploads video buffer to R2 storage
 */
async function uploadVideoToR2(
  videoBuffer: Buffer,
  compositionId?: string
): Promise<{ publicUrl: string; key: string }> {
  try {
    // Generate unique key
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const baseKey = compositionId 
      ? `compositions/${compositionId}/sora-videos`
      : 'sora-videos';
    const key = `${baseKey}/${timestamp}-${randomString}.mp4`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: videoBuffer,
      ContentType: 'video/mp4',
    });

    await r2Client.send(command);

    // Generate public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return { publicUrl, key };
  } catch (error: any) {
    console.error('R2 upload error:', error.message);
    throw new Error('Failed to upload video to R2');
  }
}

/**
 * Main function to generate video from image
 * Orchestrates the full pipeline: decode → validate → generate → upload
 */
export async function generateVideoFromImage(
  request: SoraVideoRequest
): Promise<SoraVideoResult> {
  const { image, prompt, compositionId } = request;

  try {
    console.log('Starting video generation', { 
      compositionId, 
      promptLength: prompt.length 
    });

    // Step 1: Decode base64 image
    const imageBuffer = decodeBase64Image(image);
    console.log('Image decoded', { size: imageBuffer.length });

    // Step 2: Validate image format
    validateImageFormat(imageBuffer);
    console.log('Image format validated');

    // Step 3: Generate video with Sora
    const videoBuffer = await generateVideoWithSora(imageBuffer, prompt);
    console.log('Video generated', { size: videoBuffer.length });

    // Step 4: Upload to R2
    const { publicUrl, key } = await uploadVideoToR2(videoBuffer, compositionId);
    console.log('Video uploaded to R2', { key });

    // Step 5: Return result with estimated duration
    return {
      videoUrl: publicUrl,
      key,
      durationInSeconds: SORA_DEFAULT_DURATION,
    };
  } catch (error: any) {
    console.error('Video generation failed', {
      compositionId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export interface DroneShotRequest {
  compositionId: string;
  imageBase64: string;
}

/**
 * Crops image to 1280x720 resolution
 * Uses cover strategy to maintain aspect ratio and fill the target dimensions
 */
async function cropImageTo1280x720(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const croppedBuffer = await sharp(imageBuffer)
      .resize(1280, 720, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer();
    
    return croppedBuffer;
  } catch (error: any) {
    console.error('Image crop error:', error.message);
    throw new Error('Failed to crop image to 1280x720');
  }
}

/**
 * Calls Sora 2 Pro API with inpaint mode to generate drone shot video
 */
async function generateDroneVideoWithSora(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SORA_TIMEOUT_MS);

    try {
      // Convert buffer to base64 for OpenAI API
      const base64Image = imageBuffer.toString('base64');
      
      // Drone shot prompt optimized for aerial cinematography
      const dronePrompt = "Cinematic aerial drone shot pulling back and rising up to reveal the full scene from above, smooth camera movement, professional cinematography, 4K quality";
      
      // Call Sora 2 Pro API with inpaint mode at 1280x720
      // Note: This uses the actual Sora API structure when available
      const response = await openai.chat.completions.create({
        model: 'sora-2-pro', // Sora 2 Pro model
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: dronePrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        // Sora-specific parameters
        max_tokens: 1000,
        temperature: 0.7,
        // @ts-ignore - Sora-specific parameters
        video_generation: {
          mode: 'inpaint',
          resolution: '1280x720',
          duration: SORA_DEFAULT_DURATION,
        },
      }, {
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);

      // For now, return a placeholder buffer
      // In production, this would download the actual video from Sora's response
      throw new Error('Sora API integration pending - actual video generation not yet available');
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Video generation timed out');
      }
      
      // Handle OpenAI API errors
      if (error.status === 401) {
        throw new Error('OpenAI API authentication failed');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded');
      } else if (error.status >= 500) {
        throw new Error('Sora API unavailable');
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Sora API error:', error.message);
    throw error;
  }
}

/**
 * Main function to generate AI drone shot video from image
 * Orchestrates: decode → validate → crop to 1280x720 → generate with Sora 2 Pro → upload
 */
export async function generateDroneShotFromImage(
  request: DroneShotRequest
): Promise<SoraVideoResult> {
  const { compositionId, imageBase64 } = request;

  try {
    console.log('Starting AI drone shot generation', { 
      compositionId,
    });

    // Step 1: Decode base64 image
    const imageBuffer = decodeBase64Image(imageBase64);
    console.log('Image decoded', { size: imageBuffer.length });

    // Step 2: Validate image format
    validateImageFormat(imageBuffer);
    console.log('Image format validated');

    // Step 3: Crop image to 1280x720
    const croppedBuffer = await cropImageTo1280x720(imageBuffer);
    console.log('Image cropped to 1280x720', { size: croppedBuffer.length });

    // Step 4: Generate video with Sora 2 Pro (inpaint mode, 1280x720)
    const videoBuffer = await generateDroneVideoWithSora(croppedBuffer);
    console.log('Video generated', { size: videoBuffer.length });

    // Step 5: Upload to R2
    const { publicUrl, key } = await uploadVideoToR2(videoBuffer, compositionId);
    console.log('Video uploaded to R2', { key });

    // Step 6: Return result with estimated duration
    return {
      videoUrl: publicUrl,
      key,
      durationInSeconds: SORA_DEFAULT_DURATION,
    };
  } catch (error: any) {
    console.error('AI drone shot generation failed', {
      compositionId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
