# Implementation Plan

- [x] 1. Create API client methods for composition management
  - Add getAllCompositions() method to fetch all video compositions from backend
  - Add getComposition(id) method to fetch single composition by ID
  - Add createComposition(data) method to create new composition with default data
  - Add updateComposition(id, data) method to update existing composition
  - Add getBatchPresignedUrls(request) method to request presigned URLs for multiple files
  - Use existing makeRequest utility and follow established error handling patterns
  - _Requirements: 1.1, 1.2, 2.2, 2.3, 3.2, 3.3, 4.2, 4.3, 5.2, 5.3_

- [x] 2. Create file upload utility module
  - [x] 2.1 Implement core upload functions
    - Create apps/web/app/lib/upload.ts with uploadFile() and uploadBatch() functions
    - Add file type validation (mp4, mov, avi for video; mp3, wav, m4a for audio; jpg, png, webp for images)
    - Add file size validation (max 500MB per file)
    - Implement upload to R2 using presigned URLs with fetch API
    - Add error handling and retry logic (max 3 attempts)
    - _Requirements: 4.1, 4.5, 5.4_

- [x] 3. Create ProjectCard component
  - [x] 3.1 Build ProjectCard UI component
    - Create apps/web/app/components/ProjectCard.tsx using shadcn Card components
    - Display project ID (first 8 characters), creation date, client name, and location
    - Add hover effects and click handler for navigation
    - Format dates using date-fns or similar library
    - Extract client name and location from composition_components.intro
    - _Requirements: 1.3, 1.5_

- [x] 4. Create Projects homepage route
  - [x] 4.1 Implement Projects page component
    - Create apps/web/app/routes/projects.tsx as new homepage
    - Fetch all compositions on component mount using getAllCompositions()
    - Display loading state during fetch
    - Render ProjectCard components in responsive grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
    - Add "Create New Project" button in header
    - Implement empty state when no projects exist
    - Add error state with retry button for failed fetches
    - _Requirements: 1.1, 1.3, 1.4, 2.1_
  
  - [x] 4.2 Implement project creation flow
    - Add click handler for "Create New Project" button
    - Call createComposition() with default WarehouseVideoProps data
    - Navigate to editor route with new project ID on success
    - Show error notification on failure
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 5. Update routing configuration
  - Modify apps/web/app/routes.ts to set projects.tsx as index route
  - Change editor route to "editor/:id" pattern with dynamic ID parameter
  - Keep existing render and progress routes unchanged
  - _Requirements: 1.1, 2.5, 3.1_

- [x] 6. Enhance Editor route with project loading and saving
  - [x] 6.1 Add project loading functionality
    - Rename apps/web/app/routes/Editor.tsx to apps/web/app/routes/editor.$id.tsx
    - Extract project ID from URL params using useParams()
    - Fetch composition data on mount using getComposition(id)
    - Show loading state while fetching
    - Initialize form with fetched composition_components data
    - Handle 404 errors with "Back to Projects" button
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 6.2 Implement media file tracking
    - Add pendingUploads state as Map<string, File> to track files by field path
    - Modify VideoUpload component to store files in pendingUploads instead of immediate upload
    - Add visual indicators for pending uploads (e.g., file name display)
    - Clear pending uploads after successful save
    - _Requirements: 4.1, 5.2_
  
  - [x] 6.3 Implement save functionality
    - Add "Save Project" button to editor interface
    - Add isSaving state to disable button during save operation
    - On save click, collect all pending uploads with field paths
    - Call getBatchPresignedUrls() with composition ID and file metadata
    - Upload all files to R2 in parallel using uploadBatch()
    - Build urlMappings object from upload results (fieldPath -> publicUrl)
    - Merge urlMappings into form data
    - Call updateComposition() with merged data
    - Show success notification using toast or alert
    - Show error notification with specific failure details
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 7. Add navigation between pages
  - Add "Back to Projects" button in editor header
  - Use React Router's useNavigate() for programmatic navigation
  - Ensure navigation preserves unsaved changes warning (optional enhancement)
  - _Requirements: 1.5, 2.5_

- [x] 8. Implement error handling and user feedback
  - Add error boundaries for component-level error catching
  - Implement toast notifications for success/error messages (use existing UI patterns or add shadcn toast)
  - Add loading spinners for async operations
  - Display specific error messages for different failure scenarios
  - _Requirements: 1.1, 2.2, 3.2, 4.5, 5.8_
