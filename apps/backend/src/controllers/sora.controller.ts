import { Request, Response } from 'express';
import { z } from 'zod';
import { generateVideoFromImage, generateDroneShotFromImage } from '../services/sora.service';

// Zod validation schema for Sora video generation request
const SoraVideoRequestSchema = z.object({
  image: z
    .string()
    .min(1, 'Image is required')
    .refine(
      (val) => {
        // Check if it's a valid base64 string (with or without data URI prefix)
        const base64Data = val.includes(',') ? val.split(',')[1] : val;
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        return base64Regex.test(base64Data) && base64Data.length > 0;
      },
      { message: 'Invalid base64 format' }
    ),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(1000, 'Prompt must not exceed 1000 characters'),
  compositionId: z.string().uuid().optional(),
});

export const generateVideoHandler = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = SoraVideoRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { image, prompt, compositionId } = validationResult.data;

    // Call service to generate video
    const result = await generateVideoFromImage({
      image,
      prompt,
      compositionId,
    });

    // Return success response
    res.status(200).json({
      success: true,
      videoUrl: result.videoUrl,
      key: result.key,
      durationInSeconds: result.durationInSeconds,
    });
  } catch (error: any) {
    // Log error with context
    console.error('Error generating video:', {
      compositionId: req.body?.compositionId,
      errorType: error.constructor.name,
      message: error.message,
    });

    // Handle specific error types
    if (error.message.includes('authentication failed') || error.message.includes('API key')) {
      return res.status(401).json({
        error: 'OpenAI API authentication failed',
      });
    }

    if (error.message.includes('Rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Please try again later',
      });
    }

    if (error.message.includes('unavailable') || error.message.includes('timed out')) {
      return res.status(503).json({
        error: 'Sora API unavailable',
        message: 'Video generation service is temporarily unavailable',
      });
    }

    if (
      error.message.includes('Invalid base64') ||
      error.message.includes('Unsupported image format') ||
      error.message.includes('Invalid image')
    ) {
      return res.status(400).json({
        error: 'Invalid image data',
        message: error.message,
      });
    }

    if (error.message.includes('Failed to upload video to R2')) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to upload video to storage',
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Zod validation schema for AI drone shot generation request
const DroneShotRequestSchema = z.object({
  compositionId: z.string().uuid('Invalid composition ID format'),
  imageBase64: z
    .string()
    .min(1, 'Image is required')
    .refine(
      (val) => {
        // Check if it's a valid base64 string (with or without data URI prefix)
        const base64Data = val.includes(',') ? val.split(',')[1] : val;
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        return base64Regex.test(base64Data) && base64Data.length > 0;
      },
      { message: 'Invalid base64 format' }
    ),
});

export const generateDroneShot = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = DroneShotRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { compositionId, imageBase64 } = validationResult.data;

    // Call service to generate drone shot video
    const result = await generateDroneShotFromImage({
      compositionId,
      imageBase64,
    });

    // Return success response
    res.status(200).json({
      success: true,
      videoUrl: result.videoUrl,
      key: result.key,
      durationInSeconds: result.durationInSeconds,
    });
  } catch (error: any) {
    // Log error with context
    console.error('Error generating drone shot:', {
      compositionId: req.body?.compositionId,
      errorType: error.constructor.name,
      message: error.message,
    });

    // Handle specific error types
    if (error.message.includes('authentication failed') || error.message.includes('API key')) {
      return res.status(401).json({
        error: 'OpenAI API authentication failed',
      });
    }

    if (error.message.includes('Rate limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Please try again later',
      });
    }

    if (error.message.includes('unavailable') || error.message.includes('timed out')) {
      return res.status(503).json({
        error: 'Sora API unavailable',
        message: 'Video generation service is temporarily unavailable',
      });
    }

    if (
      error.message.includes('Invalid base64') ||
      error.message.includes('Unsupported image format') ||
      error.message.includes('Invalid image') ||
      error.message.includes('crop')
    ) {
      return res.status(400).json({
        error: 'Invalid image data',
        message: error.message,
      });
    }

    if (error.message.includes('Failed to upload video to R2')) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to upload video to storage',
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
