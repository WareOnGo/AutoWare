import { Request, Response } from 'express';
import { generatePresignedUploadUrl, generateBatchPresignedUrls } from '../services/r2.service';
import { z } from 'zod';

const PresignedUrlRequestSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  compositionId: z.string().uuid(),
  mediaType: z.enum(['video', 'audio', 'image']),
});

const BatchPresignedUrlRequestSchema = z.object({
  compositionId: z.string().uuid(),
  files: z.array(
    z.object({
      fileName: z.string(),
      fileType: z.string(),
      mediaType: z.enum(['video', 'audio', 'image']),
      fieldPath: z.string(),
    })
  ),
});

export const getPresignedUploadUrlHandler = async (req: Request, res: Response) => {
  try {
    const validationResult = PresignedUrlRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const result = await generatePresignedUploadUrl(validationResult.data);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBatchPresignedUploadUrlsHandler = async (req: Request, res: Response) => {
  try {
    const validationResult = BatchPresignedUrlRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const results = await generateBatchPresignedUrls(validationResult.data);
    res.status(200).json({ uploads: results });
  } catch (error) {
    console.error('Error generating batch presigned URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const proxyImageHandler = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log('Proxying image:', url);

    // Fetch the image
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `Failed to fetch image: ${response.statusText}`
      });
    }

    // Get content type from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Validate it's an image
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }

    // Set CORS headers to allow canvas access
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });

    // Stream the image data
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
