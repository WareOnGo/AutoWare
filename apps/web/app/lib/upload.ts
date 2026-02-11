import { getBatchPresignedUrls } from './api';

// File validation constants
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes

const ALLOWED_FILE_TYPES = {
  video: ['mp4', 'mov', 'avi'],
  audio: ['mp3', 'wav', 'm4a'],
  image: ['jpg', 'jpeg', 'png', 'webp'],
} as const;

const MAX_RETRY_ATTEMPTS = 3;

// Types
export interface UploadRequest {
  file: File;
  compositionId: string;
  fieldPath: string;
  mediaType: 'video' | 'audio' | 'image';
}

export interface UploadResult {
  fieldPath: string;
  publicUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Validates file type against allowed extensions for the media type
 * @param file - The file to validate
 * @param mediaType - The expected media type
 * @returns true if valid, false otherwise
 */
function validateFileType(file: File, mediaType: 'video' | 'audio' | 'image'): boolean {
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop();
  
  if (!extension) {
    return false;
  }
  
  const allowedTypes = ALLOWED_FILE_TYPES[mediaType];
  return allowedTypes.some(type => type === extension);
}

/**
 * Validates file size against maximum allowed size
 * @param file - The file to validate
 * @returns true if valid, false otherwise
 */
function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Validates a file for upload
 * @param file - The file to validate
 * @param mediaType - The expected media type
 * @throws Error if validation fails
 */
function validateFile(file: File, mediaType: 'video' | 'audio' | 'image'): void {
  if (!validateFileSize(file)) {
    throw new Error(
      `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }
  
  if (!validateFileType(file, mediaType)) {
    const allowedTypes = ALLOWED_FILE_TYPES[mediaType].join(', ');
    throw new Error(
      `File "${file.name}" has invalid type for ${mediaType}. Allowed types: ${allowedTypes}`
    );
  }
}

/**
 * Uploads a file to R2 using a presigned URL with retry logic
 * @param uploadUrl - The presigned URL for upload
 * @param file - The file to upload
 * @param attempt - Current attempt number (for retry logic)
 * @returns Promise that resolves when upload completes
 * @throws Error if upload fails after max retries
 */
async function uploadToR2WithRetry(
  uploadUrl: string,
  file: File,
  attempt: number = 1
): Promise<void> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  } catch (error) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      // Exponential backoff: wait 1s, 2s, 4s between retries
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return uploadToR2WithRetry(uploadUrl, file, attempt + 1);
    }
    
    throw error;
  }
}

/**
 * Uploads a single file to R2 storage
 * @param request - Upload request containing file, composition ID, field path, and media type
 * @returns Upload result with success status and public URL or error message
 */
export async function uploadFile(request: UploadRequest): Promise<UploadResult> {
  const { file, compositionId, fieldPath, mediaType } = request;
  
  try {
    // Validate file
    validateFile(file, mediaType);
    
    // Get presigned URL from backend
    const response = await getBatchPresignedUrls({
      compositionId,
      files: [{
        fileName: file.name,
        fileType: file.type,
        mediaType,
        fieldPath,
      }],
    });
    
    if (!response.uploads || response.uploads.length === 0) {
      throw new Error('Failed to get presigned URL from server');
    }
    
    const { uploadUrl, publicUrl } = response.uploads[0];
    
    // Upload file to R2 with retry logic
    await uploadToR2WithRetry(uploadUrl, file);
    
    return {
      fieldPath,
      publicUrl,
      success: true,
    };
  } catch (error) {
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Provide more specific error messages
    if (errorMessage.includes('exceeds maximum size')) {
      errorMessage = `File too large: ${file.name} (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`;
    } else if (errorMessage.includes('invalid type')) {
      errorMessage = `Invalid file type: ${file.name}`;
    } else if (errorMessage.includes('Upload failed with status')) {
      errorMessage = `Upload failed for ${file.name}. Please try again.`;
    } else if (errorMessage.includes('Failed to get presigned URL')) {
      errorMessage = `Server error: Unable to prepare upload for ${file.name}`;
    } else if (errorMessage.includes('fetch')) {
      errorMessage = `Network error: Unable to upload ${file.name}`;
    }
    
    return {
      fieldPath,
      publicUrl: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Uploads multiple files to R2 storage in parallel
 * @param requests - Array of upload requests
 * @returns Array of upload results for each file
 */
export async function uploadBatch(requests: UploadRequest[]): Promise<UploadResult[]> {
  if (requests.length === 0) {
    return [];
  }

  try {
    // Validate all files first
    for (const request of requests) {
      validateFile(request.file, request.mediaType);
    }

    // Get all presigned URLs in a single batch request
    const compositionId = requests[0].compositionId;
    const response = await getBatchPresignedUrls({
      compositionId,
      files: requests.map(req => ({
        fileName: req.file.name,
        fileType: req.file.type,
        mediaType: req.mediaType,
        fieldPath: req.fieldPath,
      })),
    });

    if (!response.uploads || response.uploads.length === 0) {
      throw new Error('Failed to get presigned URLs from server');
    }

    // Upload all files in parallel
    const uploadPromises = requests.map(async (request, index) => {
      const urlData = response.uploads[index];
      
      try {
        await uploadToR2WithRetry(urlData.uploadUrl, request.file);
        
        return {
          fieldPath: request.fieldPath,
          publicUrl: urlData.publicUrl,
          success: true,
        };
      } catch (error) {
        let errorMessage = 'Unknown error occurred';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        // Provide more specific error messages
        if (errorMessage.includes('Upload failed with status')) {
          errorMessage = `Upload failed for ${request.file.name}. Please try again.`;
        } else if (errorMessage.includes('fetch')) {
          errorMessage = `Network error: Unable to upload ${request.file.name}`;
        }
        
        return {
          fieldPath: request.fieldPath,
          publicUrl: '',
          success: false,
          error: errorMessage,
        };
      }
    });

    return Promise.all(uploadPromises);
  } catch (error) {
    // If validation or presigned URL generation fails, return errors for all files
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Provide more specific error messages
    if (errorMessage.includes('exceeds maximum size')) {
      // Find which file failed
      const failedFile = requests.find(req => !validateFileSize(req.file));
      if (failedFile) {
        errorMessage = `File too large: ${failedFile.file.name} (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`;
      }
    } else if (errorMessage.includes('invalid type')) {
      // Find which file failed
      const failedFile = requests.find(req => !validateFileType(req.file, req.mediaType));
      if (failedFile) {
        errorMessage = `Invalid file type: ${failedFile.file.name}`;
      }
    } else if (errorMessage.includes('Failed to get presigned URL')) {
      errorMessage = `Server error: Unable to prepare uploads`;
    }

    return requests.map(request => ({
      fieldPath: request.fieldPath,
      publicUrl: '',
      success: false,
      error: errorMessage,
    }));
  }
}
