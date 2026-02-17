# Image Upload and Render Support

## Overview
The media pipeline now supports both video and image uploads across all sections. Images are displayed with a default duration of 3 seconds (or the audio duration if longer).

## Supported Sections

All the following sections now support both video and image uploads:

1. **Satellite & Drone Section** - Already had `satelliteImageUrl` support
2. **Location Highlights** - Already had `satelliteImageUrl` support  
3. **Internal Wide Shot** - New `imageUrl` field
4. **Internal Dock** - New `imageUrl` field
5. **Internal Utilities** - New `imageUrl` field
6. **External Docking** - New `imageUrl` field
7. **Compliance** - New `imageUrl` field

## How It Works

### Upload
- Image fields are automatically detected by the `SchemaFormGenerator` component
- Any field containing "image" in its name will use the `ImageUpload` component
- Supported formats: JPG, JPEG, PNG, WebP
- Maximum file size: 500MB
- Images are uploaded to Cloudflare R2 storage

### Rendering
- Images are displayed using the `ImageDisplay` component in Remotion
- Default display duration: 3 seconds (or audio duration if longer)
- Images are displayed with `objectFit: cover` to fill the frame
- Audio and subtitles overlay on top of the image

### Priority
When both video and image are provided for a section:
- Video takes priority and will be displayed
- Image is used as a fallback if no video is provided
- If neither is provided, a placeholder message is shown

## Usage Example

```typescript
// In your composition data
complianceSection: {
  fireSafetyVideoUrl: "", // Optional video
  imageUrl: "https://r2.example.com/image.jpg", // Optional image
  safetyFeatures: ["hydrants", "sprinklers"],
  audio: {
    audioUrl: "https://r2.example.com/audio.mp3",
    durationInSeconds: 5,
    transcript: "This facility has fire safety equipment"
  }
}
```

## Technical Details

### Components
- `ImageUpload.tsx` - Upload UI component for images
- `ImageDisplay.tsx` - Remotion component for rendering images
- `SchemaFormGenerator.tsx` - Automatically detects image fields

### Schema Changes
All video sections now have an optional `imageUrl` field:
```typescript
imageUrl: MediaUrl.optional() // Alternative to video - displays for 3 seconds by default
```

### Duration Calculation
Images follow the same duration logic as videos:
- Minimum duration: `audio.durationInSeconds + 1 second`
- Can be overridden with `sectionDurationInSeconds`
- Default display: 3 seconds if no audio
