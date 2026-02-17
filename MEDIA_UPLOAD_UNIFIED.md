# Unified Media Upload Component

## Overview
Created a unified `MediaUpload` component that allows users to upload either a video OR an image, showing only one upload field at a time. This replaces the previous approach where both video and image upload fields were shown separately.

## Changes Made

### 1. New Component: `MediaUpload.tsx`

A unified upload component that:
- Accepts both video and image files
- Automatically detects file type on upload
- Shows only one upload field at a time
- Displays appropriate preview (video player or image)
- Clears the other field when one is uploaded
- Shows file type indicator (Video or Image icon)

#### Props
```typescript
interface MediaUploadProps {
    videoValue?: string;
    imageValue?: string;
    onVideoChange?: (url: string) => void;
    onImageChange?: (url: string) => void;
    onFileSelect?: (file: File | null, type: 'video' | 'image') => void;
    className?: string;
    label?: string;
}
```

#### Features
- Single file input that accepts both `video/*` and `image/*`
- Automatic type detection based on file MIME type
- Preview shows video player for videos, image for images
- File type badge shows "Video" or "Image"
- Remove button clears both fields
- Blob URL management for previews

### 2. Updated `SchemaFormGenerator.tsx`

Modified the form generator to:
- Detect when an object has both `videoUrl` and `imageUrl` fields
- Use `MediaUpload` component instead of separate `VideoUpload` and `ImageUpload`
- Skip rendering individual video/image fields when both exist
- Pass both field values and handlers to `MediaUpload`

#### Detection Logic
```typescript
const hasVideoUrl = shape.videoUrl !== undefined;
const hasImageUrl = shape.imageUrl !== undefined;
const shouldUseMediaUpload = hasVideoUrl && hasImageUrl;
```

When both fields exist:
- Renders `MediaUpload` once (on the `videoUrl` field)
- Skips rendering `imageUrl` field
- Connects both form fields to the unified component

## User Experience

### Before
- Two separate upload fields: "Upload Video" and "Upload Image"
- User could see both fields even though only one should be used
- Confusing which one to use

### After
- Single upload field: "Upload Video or Image"
- User selects one file (video or image)
- System automatically determines type
- Only one media item shown at a time
- Clear indication of what type was uploaded

## Sections Using MediaUpload

The following sections now use the unified MediaUpload component:

1. **Approach Road Section**
   - `videoUrl` + `imageUrl` → MediaUpload

2. **Internal Wide Shot Section**
   - `videoUrl` + `imageUrl` → MediaUpload

3. **Internal Dock Section**
   - `videoUrl` + `imageUrl` → MediaUpload

4. **Internal Utilities Section**
   - `videoUrl` + `imageUrl` → MediaUpload

5. **External Docking Section**
   - `dockPanVideoUrl` + `imageUrl` → MediaUpload

6. **Compliance Section**
   - `fireSafetyVideoUrl` + `imageUrl` → MediaUpload

## Technical Details

### File Type Detection
```typescript
const isVideo = file.type.startsWith("video/");
const isImage = file.type.startsWith("image/");
```

### Field Clearing
When a video is uploaded:
- `videoUrl` is set to the blob URL
- `imageUrl` is cleared to empty string

When an image is uploaded:
- `imageUrl` is set to the blob URL
- `videoUrl` is cleared to empty string

### Upload Flow
1. User clicks upload area
2. File picker opens with filter: `video/*,image/*`
3. User selects file
4. Component detects type (video or image)
5. Creates blob URL for preview
6. Sets appropriate field value
7. Clears the other field value
8. Calls `onFileSelect` with file and type
9. Upload system handles R2 upload

## Benefits

1. **Cleaner UI**: Single upload field instead of two
2. **Less Confusion**: Clear that only one media type should be used
3. **Better UX**: Automatic type detection
4. **Consistent**: Same pattern across all sections
5. **Flexible**: Still supports both video and image
6. **Maintainable**: Single component to update

## Backward Compatibility

The component is fully backward compatible:
- Existing projects with video URLs continue to work
- Existing projects with image URLs continue to work
- Form data structure unchanged (still has both fields)
- Rendering logic handles both video and image

## Testing Recommendations

1. Upload video file - verify it shows video preview
2. Upload image file - verify it shows image preview
3. Upload video, then upload image - verify video is replaced
4. Upload image, then upload video - verify image is replaced
5. Remove media - verify both fields are cleared
6. Save and reload - verify media persists correctly
7. Test in all sections that have both video and image fields
8. Verify upload to R2 works for both types
9. Verify rendering in Remotion works for both types
