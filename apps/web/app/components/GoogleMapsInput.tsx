import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "./ui/form";

interface GoogleMapsInputProps {
    value?: { lat: number; lng: number };
    onChange: (value: { lat: number; lng: number }) => void;
    label?: string;
}

// Extract lat/lng from various Google Maps URL formats
function extractLatLngFromMapsUrl(url: string): { lat: number; lng: number } | null {
    if (!url) return null;

    // Format 1: https://www.google.com/maps/@28.4744,77.5040,15z
    const atFormat = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atFormat) {
        return {
            lat: parseFloat(atFormat[1]),
            lng: parseFloat(atFormat[2]),
        };
    }

    // Format 2: https://www.google.com/maps/place/.../@28.4744,77.5040
    const placeFormat = url.match(/place\/[^\/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeFormat) {
        return {
            lat: parseFloat(placeFormat[1]),
            lng: parseFloat(placeFormat[2]),
        };
    }

    // Format 3: ?q=28.4744,77.5040
    const qFormat = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qFormat) {
        return {
            lat: parseFloat(qFormat[1]),
            lng: parseFloat(qFormat[2]),
        };
    }

    // Format 4: /maps?ll=28.4744,77.5040
    const llFormat = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llFormat) {
        return {
            lat: parseFloat(llFormat[1]),
            lng: parseFloat(llFormat[2]),
        };
    }

    return null;
}

export function GoogleMapsInput({ value, onChange, label = "Location" }: GoogleMapsInputProps) {
    const [mapsUrl, setMapsUrl] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Generate Google Maps URL from lat/lng on component mount
    useEffect(() => {
        if (value && value.lat && value.lng && !mapsUrl) {
            setMapsUrl(`https://www.google.com/maps/@${value.lat},${value.lng},15z`);
        }
    }, [value, mapsUrl]);

    const handleUrlChange = (url: string) => {
        setMapsUrl(url);
        setError(null);

        if (!url) {
            onChange({ lat: 0, lng: 0 });
            return;
        }

        const coords = extractLatLngFromMapsUrl(url);
        if (coords) {
            onChange(coords);
            setError(null);
        } else {
            setError("Could not extract coordinates from URL. Please use a valid Google Maps link.");
        }
    };

    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <div className="space-y-2">
                    <Input
                        type="url"
                        placeholder="https://www.google.com/maps/@28.4744,77.5040,15z"
                        value={mapsUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                    />
                    {value && value.lat !== 0 && value.lng !== 0 && (
                        <FormDescription className="text-xs text-green-600">
                            ✓ Coordinates: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
                        </FormDescription>
                    )}
                    {error && (
                        <p className="text-xs text-red-600">{error}</p>
                    )}
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    );
}
