import { z } from "zod";
import {
  CompositionProps,
  ProgressRequest,
  ProgressResponse,
  RenderRequest,
  WarehouseVideoProps,
} from "~/remotion/schemata";
import { RenderResponse } from "./types";

export type ApiResponse<Res> =
  | {
      type: "error";
      message: string;
    }
  | {
      type: "success";
      data: Res;
    };

// VideoComposition type matching the backend model
export interface VideoComposition {
  id: string;
  composition_components: WarehouseVideoProps;
  created_at: string;
  updated_at: string;
}

// Batch presigned URL request/response types
export interface BatchPresignedUrlRequest {
  compositionId: string;
  files: Array<{
    fileName: string;
    fileType: string;
    mediaType: 'video' | 'audio' | 'image';
    fieldPath: string;
  }>;
}

export interface BatchPresignedUrlResponse {
  uploads: Array<{
    fieldPath: string;
    uploadUrl: string;
    publicUrl: string;
  }>;
}

const makeRequest = async <Res>(
  endpoint: string,
  body: unknown,
): Promise<Res> => {
  const result = await fetch(endpoint, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
  const json = (await result.json()) as ApiResponse<Res>;
  if (json.type === "error") {
    throw new Error(json.message);
  }

  return json.data;
};

// Generic fetch helper for non-POST requests
const fetchRequest = async <Res>(
  endpoint: string,
  options?: RequestInit,
): Promise<Res> => {
  try {
    const result = await fetch(endpoint, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...options?.headers,
      },
    });

    if (!result.ok) {
      const error = await result.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = error.error || error.message || `Request failed with status ${result.status}`;
      
      // Provide more specific error messages based on status code
      if (result.status === 404) {
        throw new Error(`Resource not found: ${errorMessage}`);
      } else if (result.status === 400) {
        throw new Error(`Invalid request: ${errorMessage}`);
      } else if (result.status === 401 || result.status === 403) {
        throw new Error(`Access denied: ${errorMessage}`);
      } else if (result.status >= 500) {
        throw new Error(`Server error: ${errorMessage}`);
      } else {
        throw new Error(errorMessage);
      }
    }

    return result.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    throw error;
  }
};

export const renderVideo = async ({
  inputProps,
}: {
  inputProps: z.infer<typeof CompositionProps>;
}) => {
  const body: z.infer<typeof RenderRequest> = {
    inputProps,
  };

  return makeRequest<RenderResponse>("/api/lambda/render", body);
};

export const getProgress = async ({
  id,
  bucketName,
}: {
  id: string;
  bucketName: string;
}) => {
  const body: z.infer<typeof ProgressRequest> = {
    id,
    bucketName,
  };

  return makeRequest<ProgressResponse>("/api/lambda/progress", body);
};

// Composition Management API Methods

/**
 * Fetch all video compositions from the backend
 * @returns Array of VideoComposition records ordered by creation date descending
 */
export const getAllCompositions = async (): Promise<VideoComposition[]> => {
  return fetchRequest<VideoComposition[]>('/api/composition?sortBy=created_at&sortOrder=desc');
};

/**
 * Fetch a single video composition by ID
 * @param id - The UUID of the composition
 * @returns VideoComposition record
 * @throws Error if composition not found (404)
 */
export const getComposition = async (id: string): Promise<VideoComposition> => {
  return fetchRequest<VideoComposition>(`/api/composition/${id}`);
};

/**
 * Create a new video composition with default data
 * @param data - The composition components data
 * @returns Newly created VideoComposition record
 */
export const createComposition = async (data: WarehouseVideoProps): Promise<VideoComposition> => {
  return fetchRequest<VideoComposition>('/api/composition', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing video composition (partial update)
 * @param id - The UUID of the composition
 * @param data - Partial composition components data to update
 * @returns Updated VideoComposition record
 * @throws Error if composition not found (404)
 */
export const updateComposition = async (
  id: string,
  data: Partial<WarehouseVideoProps>,
): Promise<VideoComposition> => {
  return fetchRequest<VideoComposition>(`/api/composition/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a video composition
 * @param id - The UUID of the composition
 * @throws Error if composition not found (404)
 */
export const deleteComposition = async (id: string): Promise<void> => {
  return fetchRequest<void>(`/api/composition/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Duplicate a video composition
 * @param id - The UUID of the composition to duplicate
 * @returns Newly created VideoComposition record (duplicate)
 * @throws Error if composition not found (404)
 */
export const duplicateComposition = async (id: string): Promise<VideoComposition> => {
  return fetchRequest<VideoComposition>(`/api/composition/${id}/duplicate`, {
    method: 'POST',
  });
};

/**
 * Request batch presigned URLs for multiple file uploads
 * @param request - Batch presigned URL request with composition ID and file metadata
 * @returns Array of presigned URLs with field path mappings
 */
export const getBatchPresignedUrls = async (
  request: BatchPresignedUrlRequest,
): Promise<BatchPresignedUrlResponse> => {
  return fetchRequest<BatchPresignedUrlResponse>('/api/r2/presigned-urls/batch', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};
