# Image Upload and Render Support - Test Checklist

## Upload Tests

### Image Upload Component
- [ ] Upload JPG image - verify preview shows correctly
- [ ] Upload PNG image - verify preview shows correctly  
- [ ] Upload WebP image - verify preview shows correctly
- [ ] Try to upload non-image file - verify error message
- [ ] Upload large image (close to 500MB) - verify it works
- [ ] Remove uploaded image - verify it clears correctly
- [ ] Upload image, then change to different image - verify it updates

### Form Integration
- [ ] Image fields are detected automatically (contain "image" in name)
- [ ] ImageUpload component is used for image fields
- [ ] VideoUpload component is still used for video fields
- [ ] File selection triggers pending upload tracking

### Upload to R2
- [ ] Image uploads to Cloudflare R2 successfully
- [ ] Public URL is returned and stored in form data
- [ ] Multiple images can be uploaded in batch
- [ ] Upload retry logic works on failure
- [ ] Progress indication shows during upload

## Render Tests

### Image Display in Remotion
- [ ] Image displays correctly in Remotion player
- [ ] Image fills frame with objectFit: cover
- [ ] Image displays for minimum 3 seconds
- [ ] Image displays for audio duration if longer than 3 seconds
- [ ] Audio plays over image
- [ ] Subtitles display over image
- [ ] Placeholder shows when no image or video

### Section-Specific Tests

#### Internal Wide Shot Section
- [ ] Upload image only - displays correctly
- [ ] Upload video only - displays correctly
- [ ] Upload both - video takes priority
- [ ] No media - shows placeholder

#### Internal Dock Section
- [ ] Upload image only - displays correctly
- [ ] Upload video only - displays correctly
- [ ] Upload both - video takes priority
- [ ] No media - shows placeholder

#### Internal Utilities Section
- [ ] Upload image only - displays correctly
- [ ] Upload video only - displays correctly
- [ ] Upload both - video takes priority
- [ ] No media - shows placeholder

#### External Docking Section
- [ ] Upload image only - displays correctly
- [ ] Upload video only - displays correctly
- [ ] Upload both - video takes priority
- [ ] No media - shows placeholder

#### Compliance Section
- [ ] Upload image only - displays correctly
- [ ] Upload video only - displays correctly
- [ ] Upload both - video takes priority
- [ ] No media - shows placeholder

### Duration Tests
- [ ] Image with 5-second audio displays for 6 seconds (audio + 1s padding)
- [ ] Image with no audio displays for 3 seconds (default)
- [ ] Image with custom sectionDurationInSeconds respects override
- [ ] Section duration calculation includes image duration correctly

## Integration Tests

### Project Creation
- [ ] New projects have empty imageUrl fields
- [ ] Form initializes with correct default values
- [ ] Schema validation passes with imageUrl fields

### Project Loading
- [ ] Existing projects load correctly
- [ ] Migration adds imageUrl fields to old projects
- [ ] Image URLs are preserved when saving/loading

### Save/Load Cycle
- [ ] Upload image and save - image URL persists
- [ ] Load project with image - image displays in form
- [ ] Load project with image - image renders in Remotion
- [ ] Edit image and save - new image URL replaces old

### Video Export
- [ ] Export video with images - images appear in final video
- [ ] Export video with mix of images and videos - both render correctly
- [ ] Image quality is maintained in export
- [ ] Audio sync is correct with images

## Edge Cases

- [ ] Upload image with special characters in filename
- [ ] Upload image with very long filename
- [ ] Upload image with no extension
- [ ] Upload image with uppercase extension (.JPG)
- [ ] Network failure during upload - retry works
- [ ] Cancel upload mid-way - state cleans up correctly
- [ ] Switch between image and video multiple times
- [ ] Delete image after upload but before save

## Performance Tests

- [ ] Multiple images upload in parallel efficiently
- [ ] Large images (100MB+) upload without timeout
- [ ] Image preview loads quickly
- [ ] Remotion player handles images smoothly
- [ ] No memory leaks with multiple image uploads

## Browser Compatibility

- [ ] Chrome - all features work
- [ ] Firefox - all features work
- [ ] Safari - all features work
- [ ] Edge - all features work

## Accessibility

- [ ] Image upload has proper labels
- [ ] Keyboard navigation works for image upload
- [ ] Screen reader announces image upload status
- [ ] Error messages are accessible
