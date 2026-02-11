# Design Document

## Overview

This design establishes a project management system for video composition projects, integrating the frontend React application with the backend Express API. The system provides two primary user interfaces: a homepage displaying all projects as cards with creation capabilities, and a detailed editor view for individual project management with integrated media upload functionality.

The architecture leverages existing infrastructure including the VideoComposition database model, R2 storage service, and composition API endpoints. The design introduces new frontend routes, API client methods, and UI components while maintaining consistency with the existing codebase patterns.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Projects Page │  │ Editor Page  │  │ API Client      │ │
│  │  (Homepage)    │  │ (Split View) │  │ (api.ts)        │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Server                      │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Composition      │  │ R2 Service   │  │ Composition  │  │
│  │ Controller       │  │ Controller   │  │ Service      │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │  PostgreSQL  │        │  R2 Storage  │
        │  Database    │        │  (Media)     │
        └──────────────┘        └──────────────┘
```

### Data Flow

1. **Project List Flow**: Frontend → GET /api/composition → Backend → Database → Response
2. **Project Creation Flow**: Frontend → POST /api/composition → Backend → Database → Response → Navigate
3. **Project Load Flow**: Frontend → GET /api/composition/:id → Backend → Database → Response → Populate Form
4. **Media Upload Flow**: Frontend → POST /api/r2/presigned-batch → Backend → R2 → Upload Files → PATCH /api/composition/:id → Database
5. **Project Save Flow**: Frontend → PATCH /api/composition/:id → Backend → Database → Response

## Components and Interfaces

### Frontend Components

#### 1. Projects Homepage (`apps/web/app/routes/projects.tsx`)

New route component that replaces the current homepage.

**Responsibilities:**
- Fetch all video compositions on mount
- Display projects as shadcn cards in a responsive grid
- Provide "Create New Project" button
- Handle navigation to editor view

**Key Elements:**
```typescript
interface ProjectCardProps {
  id: string;
  createdAt: string;
  updatedAt: string;
  compositionData: WarehouseVideoProps;
}

// Component structure:
// - Header with logo and "Create New Project" button
// - Loading state during fetch
// - Grid of ProjectCard components
// - Empty state when no projects exist
// - Error state for failed fetches
```

#### 2. Project Card Component (`apps/web/app/components/ProjectCard.tsx`)

Reusable card component for displaying project summary.

**Responsibilities:**
- Display project metadata (ID, dates)
- Extract and show preview information (client name, location)
- Handle click navigation to editor
- Show project status indicator

**Visual Design:**
- Uses shadcn Card, CardHeader, CardTitle, CardDescription, CardContent
- Displays truncated project ID
- Shows formatted creation date
- Displays client name and location from intro section
- Hover effect for interactivity
- Click handler navigates to `/editor/:id`

#### 3. Enhanced Editor Route (`apps/web/app/routes/editor.$id.tsx`)

Modified version of existing Editor.tsx with project loading and saving.

**Responsibilities:**
- Load project data by ID from URL parameter
- Initialize form with loaded composition data
- Track pending media file uploads
- Handle save operation with media upload orchestration
- Provide real-time preview updates

**State Management:**
```typescript
interface EditorState {
  projectId: string;
  isLoading: boolean;
  isSaving: boolean;
  pendingUploads: Map<string, File>; // fieldPath -> File
  compositionData: WarehouseVideoProps | null;
  error: string | null;
}
```

**Save Flow Logic:**
1. Collect all pending file uploads with field paths
2. Request batch presigned URLs from backend
3. Upload files to R2 in parallel using Promise.all
4. Build URL mappings object (fieldPath -> publicUrl)
5. Send PATCH request with updated composition data
6. Clear pending uploads on success
7. Show success/error notification

#### 4. Media Upload Handler (`apps/web/app/lib/upload.ts`)

New utility module for handling file uploads.

**Responsibilities:**
- Validate file types and sizes
- Request presigned URLs from backend
- Upload files to R2 using presigned URLs
- Track upload progress
- Handle upload errors and retries

**Key Functions:**
```typescript
interface UploadRequest {
  file: File;
  compositionId: string;
  fieldPath: string;
  mediaType: 'video' | 'audio' | 'image';
}

interface UploadResult {
  fieldPath: string;
  publicUrl: string;
  success: boolean;
  error?: string;
}

async function uploadFile(request: UploadRequest): Promise<UploadResult>
async function uploadBatch(requests: UploadRequest[]): Promise<UploadResult[]>
```

### Backend Components

#### 1. Enhanced API Client (`apps/web/app/lib/api.ts`)

Extended with new composition and upload methods.

**New Methods:**
```typescript
// Fetch all compositions
async function getAllCompositions(): Promise<VideoComposition[]>

// Fetch single composition by ID
async function getComposition(id: string): Promise<VideoComposition>

// Create new composition with default data
async function createComposition(data: WarehouseVideoProps): Promise<VideoComposition>

// Update composition (partial update)
async function updateComposition(
  id: string, 
  data: Partial<WarehouseVideoProps>
): Promise<VideoComposition>

// Request batch presigned URLs
async function getBatchPresignedUrls(request: {
  compositionId: string;
  files: Array<{
    fileName: string;
    fileType: string;
    mediaType: 'video' | 'audio' | 'image';
    fieldPath: string;
  }>;
}): Promise<{
  uploads: Array<{
    fieldPath: string;
    uploadUrl: string;
    publicUrl: string;
  }>;
}>
```

#### 2. Projects Controller (Already Exists - Needs Implementation)

The controller at `apps/backend/src/controllers/projects.controller.ts` exists but is not implemented. This design will use the existing composition controller instead, as VideoComposition is the actual project entity.

**Decision:** Use composition endpoints directly rather than creating duplicate project endpoints.

### Routing Updates

#### Frontend Routes (`apps/web/app/routes.ts`)

```typescript
export default [
  index("routes/projects.tsx"),           // New: Project list homepage
  route("editor/:id", "routes/editor.$id.tsx"),  // Modified: Editor with ID param
  route("render", "render.tsx"),          // Existing
  route("progress/:id", "progress.tsx"),  // Existing
] satisfies RouteConfig;
```

#### Backend Routes (No Changes Required)

Existing routes are sufficient:
- `GET /api/composition` - List all compositions
- `POST /api/composition` - Create composition
- `GET /api/composition/:id` - Get single composition
- `PATCH /api/composition/:id` - Update composition
- `POST /api/r2/presigned-batch` - Get batch presigned URLs

## Data Models

### VideoComposition (Database Model)

Already defined in Prisma schema:

```prisma
model VideoComposition {
  id                      String   @id @default(uuid()) @db.Uuid
  composition_components  Json
  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt
}
```

### WarehouseVideoProps (Composition Data)

Already defined in `@repo/shared` package. This is the structure stored in `composition_components` JSON field.

### Frontend Project Interface

```typescript
interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  compositionComponents: WarehouseVideoProps;
}

// Derived display data
interface ProjectDisplayData {
  id: string;
  shortId: string; // First 8 chars of UUID
  createdAt: Date;
  formattedDate: string;
  clientName: string;
  locationName: string;
  hasMedia: boolean; // Check if any media URLs are populated
}
```

### Upload Request/Response Types

```typescript
interface BatchPresignedUrlRequest {
  compositionId: string;
  files: Array<{
    fileName: string;
    fileType: string;
    mediaType: 'video' | 'audio' | 'image';
    fieldPath: string; // e.g., "satDroneSection.droneVideoUrl"
  }>;
}

interface BatchPresignedUrlResponse {
  uploads: Array<{
    fieldPath: string;
    uploadUrl: string;  // Presigned URL for upload
    publicUrl: string;  // Final public URL after upload
  }>;
}

interface UpdateMediaUrlsRequest {
  urlMappings: Record<string, string>; // fieldPath -> publicUrl
}
```

## Error Handling

### Frontend Error Scenarios

1. **Failed to Load Projects**
   - Display error message with retry button
   - Log error to console
   - Fallback to empty state

2. **Failed to Create Project**
   - Show error notification
   - Keep user on homepage
   - Log error details

3. **Failed to Load Project in Editor**
   - Display error message
   - Provide "Back to Projects" button
   - Log error with project ID

4. **Upload Failures**
   - Track which files failed
   - Show specific error messages per file
   - Allow retry for failed uploads only
   - Don't block save if some uploads succeed

5. **Save Failures**
   - Show error notification
   - Keep form data intact
   - Allow user to retry
   - Log full error context

### Backend Error Responses

All endpoints follow consistent error format:

```typescript
interface ErrorResponse {
  error: string;
  details?: any;
}
```

HTTP Status Codes:
- 400: Validation errors
- 404: Resource not found
- 500: Server errors

### Error Recovery Strategies

1. **Optimistic UI Updates**: Update UI immediately, rollback on failure
2. **Retry Logic**: Automatic retry for network failures (max 3 attempts)
3. **Partial Success Handling**: Save what succeeded, report what failed
4. **User Feedback**: Clear error messages with actionable next steps

## Testing Strategy

### Frontend Testing

#### Unit Tests

1. **ProjectCard Component**
   - Renders project data correctly
   - Formats dates properly
   - Handles click navigation
   - Shows fallback for missing data

2. **Upload Utility Functions**
   - Validates file types correctly
   - Handles upload success/failure
   - Builds correct URL mappings
   - Manages parallel uploads

3. **API Client Methods**
   - Constructs correct request payloads
   - Handles response parsing
   - Manages error responses
   - Includes proper headers

#### Integration Tests

1. **Projects Page Flow**
   - Loads and displays projects
   - Creates new project and navigates
   - Handles empty state
   - Handles error state

2. **Editor Save Flow**
   - Loads project data
   - Tracks file selections
   - Uploads files to R2
   - Updates composition
   - Shows success feedback

3. **End-to-End Project Lifecycle**
   - Create project from homepage
   - Edit in editor
   - Upload media files
   - Save changes
   - Return to homepage
   - Verify project appears with updates

### Backend Testing

#### Unit Tests

1. **Composition Service**
   - Creates composition with valid data
   - Retrieves composition by ID
   - Updates composition correctly
   - Handles non-existent IDs

2. **R2 Service**
   - Generates valid presigned URLs
   - Creates correct object keys
   - Handles batch requests
   - Validates input parameters

#### Integration Tests

1. **Composition API Endpoints**
   - GET /api/composition returns list
   - POST /api/composition creates record
   - GET /api/composition/:id returns record
   - PATCH /api/composition/:id updates record
   - Returns 404 for invalid IDs

2. **R2 Upload Flow**
   - POST /api/r2/presigned-batch returns URLs
   - URLs are valid for upload
   - Public URLs are accessible after upload
   - Handles multiple file types

### Manual Testing Checklist

1. Create new project and verify it appears on homepage
2. Click project card and verify editor loads with correct data
3. Upload video file and verify it appears in player
4. Upload audio file and verify it's included in composition
5. Save project and verify changes persist
6. Navigate back to homepage and verify project shows updated data
7. Test with slow network to verify loading states
8. Test with failed uploads to verify error handling
9. Test with invalid file types to verify validation
10. Test responsive layout on mobile and desktop

## Implementation Notes

### Default Composition Data

When creating a new project, use minimal default data:

```typescript
const defaultComposition: WarehouseVideoProps = {
  intro: {
    clientName: "New Project",
    projectLocationName: "Location TBD",
  },
  satDroneSection: {
    location: { lat: 28.4744, lng: 77.5040 },
    droneVideoUrl: "",
    audio: {
      durationInSeconds: 5,
      transcript: "",
    },
  },
  // ... minimal defaults for other sections
};
```

### File Upload Constraints

- Maximum file size: 500MB per file
- Supported video formats: mp4, mov, avi
- Supported audio formats: mp3, wav, m4a
- Supported image formats: jpg, png, webp
- Maximum concurrent uploads: 5

### Performance Considerations

1. **Lazy Loading**: Load project thumbnails progressively
2. **Pagination**: Implement pagination for project list (50 per page)
3. **Debouncing**: Debounce form changes to reduce preview re-renders
4. **Upload Progress**: Show progress bars for large file uploads
5. **Caching**: Cache project list in memory for quick navigation

### Security Considerations

1. **Presigned URL Expiration**: URLs expire after 1 hour
2. **File Type Validation**: Validate on both client and server
3. **File Size Limits**: Enforce limits on both client and server
4. **CORS Configuration**: R2 bucket must allow frontend origin
5. **Input Sanitization**: Sanitize all text inputs before storage

### Accessibility

1. **Keyboard Navigation**: All interactive elements keyboard accessible
2. **Screen Reader Support**: Proper ARIA labels on cards and buttons
3. **Focus Management**: Manage focus when navigating between pages
4. **Error Announcements**: Use ARIA live regions for error messages
5. **Color Contrast**: Ensure all text meets WCAG AA standards
