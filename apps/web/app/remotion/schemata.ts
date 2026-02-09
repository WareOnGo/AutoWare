import { z } from "zod";

// Re-export the master warehouse video schema from shared package
export { CompositionProps } from "@repo/shared";
export type { WarehouseVideoProps } from "@repo/shared";

// Legacy composition props (deprecated - use WarehouseVideoProps instead)
const LegacyCompositionProps = z.object({
  title: z.string(),
});

export const defaultMyCompProps: z.infer<typeof LegacyCompositionProps> = {
  title: "React Router and Remotion",
};

// Render request uses the shared CompositionProps from the warehouse schema
export const RenderRequest = z.object({
  inputProps: z.any(), // Accept any valid warehouse props structure
});

export const ProgressRequest = z.object({
  bucketName: z.string(),
  id: z.string(),
});

export type ProgressResponse =
  | {
    type: "error";
    message: string;
  }
  | {
    type: "progress";
    progress: number;
  }
  | {
    type: "done";
    url: string;
    size: number;
  };

