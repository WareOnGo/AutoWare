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

// Warehouse API types
export interface WarehouseResponse {
  id: number;
  warehouseOwnerType: string | null;
  warehouseType: string | null;
  address: string | null;
  googleLocation: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  zone: string | null;
  totalSpaceSqft: number | null;
  offeredSpaceSqft: number | null;
  numberOfDocks: number | null;
  clearHeightFt: number | null;
  compliances: any | null;
  otherSpecifications: any | null;
  ratePerSqft: number | null;
  availability: string | null;
  uploadedBy: string | null;
  isBroker: boolean | null;
  photos: any | null;
  createdAt: Date;
  status_updated_at: Date | null;
  visibility: string | null;
  WarehouseData: {
    id: number;
    latitude: number | null;
    longitude: number | null;
    fireNocAvailable: boolean | null;
    fireSafetyMeasures: any | null;
    landType: string | null;
    approachRoadWidth: number | null;
    dimensions: any | null;
    parkingDockingSpace: string | null;
    pollutionZone: string | null;
    powerKva: number | null;
    vaastuCompliance: boolean | null;
  } | null;
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

  // Handle non-OK HTTP responses
  if (!result.ok) {
    let errorMessage = `Request to ${endpoint} failed with status ${result.status}`;
    try {
      const errorJson = await result.json();
      if (errorJson.message) errorMessage = errorJson.message;
      else if (errorJson.type === "error" && errorJson.message) errorMessage = errorJson.message;
    } catch {
      // Response wasn't JSON, use the status text
      errorMessage = `${endpoint}: ${result.status} ${result.statusText}`;
    }
    throw new Error(errorMessage);
  }

  let json: ApiResponse<Res>;
  try {
    json = (await result.json()) as ApiResponse<Res>;
  } catch {
    throw new Error(`Invalid JSON response from ${endpoint}`);
  }

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

  return makeRequest<RenderResponse>("/render", body);
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

  return makeRequest<ProgressResponse>(`/progress/${id}`, body);
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

/**
 * Generate satellite image from Google Maps URL
 * @param compositionId - The UUID of the composition
 * @param googleMapsUrl - Google Maps URL containing coordinates
 * @returns Object with imageUrl, key, and coordinates
 */
export const generateSatelliteImage = async (
  compositionId: string,
  googleMapsUrl: string,
): Promise<{ imageUrl: string; key: string; coordinates: { lat: number; lng: number } }> => {
  return fetchRequest<{ imageUrl: string; key: string; coordinates: { lat: number; lng: number } }>(
    '/api/maps/satellite-image',
    {
      method: 'POST',
      body: JSON.stringify({
        compositionId,
        googleMapsUrl,
        updateComposition: true,
        fieldPath: 'satDroneSection.satelliteImageUrl',
      }),
    }
  );
};

// TTS API Types
export interface GenerateAudioRequest {
  compositionId: string;
  transcripts: Array<{
    text: string;
    fieldPath: string;
    voice?: string;
    language?: string;
    speed?: number;
    sampleRate?: number;
  }>;
  updateComposition?: boolean;
}

export interface GenerateAudioResponse {
  success: boolean;
  audioFiles: Array<{
    fieldPath: string;
    audioUrl: string;
    key: string;
    durationInSeconds: number;
  }>;
  compositionUpdated?: boolean;
}

/**
 * Generate audio from text using Sarvam AI TTS with timeout handling
 * @param compositionId - The UUID of the composition
 * @param transcripts - Array of transcript objects with text and fieldPath
 * @param timeoutMs - Timeout in milliseconds (default: 30000ms = 30s)
 * @returns Object with success status and audio files
 * @throws Error if request times out or fails
 */
export const generateAudioFromText = async (
  compositionId: string,
  transcripts: Array<{ 
    text: string; 
    fieldPath: string; 
    voice?: string;
    language?: string;
    speed?: number;
    sampleRate?: number;
  }>,
  timeoutMs: number = 30000,
): Promise<GenerateAudioResponse> => {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await fetch('/api/tts/generate-audio-sarvam', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        compositionId,
        transcripts,
        updateComposition: true,
      } as GenerateAudioRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!result.ok) {
      const error = await result.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = error.error || error.message || `Request failed with status ${result.status}`;

      if (result.status === 404) {
        throw new Error(`Project not found: ${errorMessage}`);
      } else if (result.status === 400) {
        throw new Error(`Invalid request: ${errorMessage}`);
      } else if (result.status >= 500) {
        throw new Error(`Server error: ${errorMessage}`);
      } else {
        throw new Error(`Failed to generate speech: ${errorMessage}`);
      }
    }

    return result.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out: TTS generation is taking longer than expected. Please try again.');
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to TTS service');
    }

    throw error;
  }
};

/**
 * Fetch warehouse details by ID
 * @param id - The warehouse ID (integer)
 * @returns WarehouseResponse with warehouse details and nested WarehouseData
 * @throws Error if warehouse not found (404), invalid ID (400), server error (500), or network error
 */
export const getWarehouseById = async (id: number): Promise<WarehouseResponse> => {
  return fetchRequest<WarehouseResponse>(`/api/warehouse/${id}`);
};
