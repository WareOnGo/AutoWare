// packages/shared/src/types.ts

// 1. Project Status Enum (Used by DB and UI)
export type ProjectStatus = 'uploading' | 'processing' | 'review' | 'rendering' | 'completed' | 'failed';

// 2. Standard API Response Wrapper
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// 3. The shape of a Project in the DB (Simplified)
export interface Project {
  id: string;
  status: ProjectStatus;
  createdAt: string;
  // This helps the frontend know it will receive the props it expects
  compositionProps: any; // Ideally, use z.infer<typeof CompositionProps> here
}