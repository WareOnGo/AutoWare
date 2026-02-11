# Requirements Document

## Introduction

This feature establishes a project management interface for video composition projects. The system enables users to view all existing video projects, create new projects, edit project compositions, and save media files with automatic upload to R2 storage. The interface provides a homepage displaying all projects as cards and a detailed editor view for individual project management.

## Glossary

- **Frontend Application**: The React-based web application that provides the user interface
- **Backend API**: The Express.js server that handles data persistence and business logic
- **VideoComposition**: A database entity storing video project data with composition components
- **R2 Storage**: Cloudflare R2 object storage service for media file hosting
- **Presigned URL**: A temporary authenticated URL for direct client-to-storage uploads
- **Composition Components**: The JSON structure containing all video section configurations
- **Project Card**: A UI component displaying summary information for a single project
- **Editor View**: A split-screen interface showing video preview and form inputs

## Requirements

### Requirement 1

**User Story:** As a video producer, I want to view all my video projects on a homepage, so that I can quickly access and manage multiple projects.

#### Acceptance Criteria

1. WHEN the Frontend Application loads the base route, THE Frontend Application SHALL fetch all VideoComposition records from the Backend API
2. WHEN the Backend API receives a request for all compositions, THE Backend API SHALL return a list of VideoComposition records ordered by creation date descending
3. WHEN the Frontend Application receives VideoComposition data, THE Frontend Application SHALL display each project as a Project Card with project ID and creation timestamp
4. WHERE multiple projects exist, THE Frontend Application SHALL arrange Project Cards in a responsive grid layout using shadcn card components
5. WHEN a user clicks on a Project Card, THE Frontend Application SHALL navigate to the Editor View for that specific VideoComposition

### Requirement 2

**User Story:** As a video producer, I want to create new video projects from the homepage, so that I can start working on new compositions.

#### Acceptance Criteria

1. WHEN the homepage displays, THE Frontend Application SHALL render a "Create New Project" button prominently above the project grid
2. WHEN a user clicks the "Create New Project" button, THE Frontend Application SHALL send a POST request to the Backend API with default Composition Components
3. WHEN the Backend API receives a create request, THE Backend API SHALL generate a new VideoComposition record with a UUID identifier
4. WHEN the Backend API successfully creates a VideoComposition, THE Backend API SHALL return the new record with its generated ID
5. WHEN the Frontend Application receives the new VideoComposition, THE Frontend Application SHALL navigate to the Editor View for the newly created project

### Requirement 3

**User Story:** As a video producer, I want to edit project details in a split-screen editor, so that I can preview changes while configuring composition properties.

#### Acceptance Criteria

1. WHEN the Editor View loads for a VideoComposition, THE Frontend Application SHALL display a video player on the left side and a form on the right side
2. WHEN the Editor View initializes, THE Frontend Application SHALL fetch the specific VideoComposition data by ID from the Backend API
3. WHEN the Backend API receives a request for a specific composition, THE Backend API SHALL return the VideoComposition record with all Composition Components
4. WHEN the Frontend Application receives composition data, THE Frontend Application SHALL populate the form fields with existing values from Composition Components
5. WHEN a user modifies form fields, THE Frontend Application SHALL update the video player preview in real-time with the new values

### Requirement 4

**User Story:** As a video producer, I want to upload media files for my project, so that I can include custom videos and audio in my composition.

#### Acceptance Criteria

1. WHEN a user selects a media file in the Editor View, THE Frontend Application SHALL identify the file type, name, and associated field path in Composition Components
2. WHEN the Frontend Application initiates an upload, THE Frontend Application SHALL request a Presigned URL from the Backend API with composition ID, file metadata, and media type
3. WHEN the Backend API receives a presigned URL request, THE Backend API SHALL generate a Presigned URL for R2 Storage with a unique object key
4. WHEN the Backend API generates a Presigned URL, THE Backend API SHALL return both the upload URL and the final public URL for the media file
5. WHEN the Frontend Application receives the Presigned URL, THE Frontend Application SHALL upload the file directly to R2 Storage using the presigned URL

### Requirement 5

**User Story:** As a video producer, I want to save my project changes with a single button, so that all media uploads and data updates are handled automatically.

#### Acceptance Criteria

1. WHEN the Editor View displays, THE Frontend Application SHALL render a "Save Project" button in the interface
2. WHEN a user clicks "Save Project" with pending media files, THE Frontend Application SHALL request batch Presigned URLs for all pending uploads
3. WHEN the Backend API receives a batch presigned URL request, THE Backend API SHALL generate Presigned URLs for all files and return them with field path mappings
4. WHEN the Frontend Application receives batch Presigned URLs, THE Frontend Application SHALL upload all media files to R2 Storage in parallel
5. WHEN all uploads complete successfully, THE Frontend Application SHALL send a PATCH request to the Backend API with updated Composition Components including new media URLs
6. WHEN the Backend API receives the PATCH request, THE Backend API SHALL merge the updates into the existing VideoComposition record
7. WHEN the Backend API successfully updates the VideoComposition, THE Backend API SHALL return the updated record with a success status
8. WHEN the Frontend Application receives confirmation, THE Frontend Application SHALL display a success notification to the user
