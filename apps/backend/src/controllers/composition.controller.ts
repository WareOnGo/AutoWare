import { Request, Response } from 'express';
import {
  createComposition,
  getCompositionById,
  getAllCompositions,
  updateComposition,
  patchComposition,
  deleteComposition,
  duplicateComposition,
  updateMediaUrls,
} from '../services/composition.service';
import { CompositionProps } from '@repo/shared';
import { z } from 'zod';

const UpdateMediaUrlsSchema = z.object({
  urlMappings: z.record(z.string(), z.string().url()),
});

export const createCompositionHandler = async (req: Request, res: Response) => {
  try {
    const validationResult = CompositionProps.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const composition = await createComposition(validationResult.data);
    res.status(201).json(composition);
  } catch (error) {
    console.error('Error creating composition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCompositionByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const composition = await getCompositionById(id);

    if (!composition) {
      return res.status(404).json({ error: 'Composition not found' });
    }

    res.status(200).json(composition);
  } catch (error) {
    console.error('Error fetching composition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllCompositionsHandler = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const sortBy = req.query.sortBy as 'created_at' | 'updated_at' | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    const compositions = await getAllCompositions({ limit, offset, sortBy, sortOrder });
    res.status(200).json(compositions);
  } catch (error) {
    console.error('Error fetching compositions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCompositionHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const validationResult = CompositionProps.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const composition = await updateComposition(id, validationResult.data);
    res.status(200).json(composition);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Composition not found' });
    }
    console.error('Error updating composition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchCompositionHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const composition = await patchComposition(id, req.body);

    if (!composition) {
      return res.status(404).json({ error: 'Composition not found' });
    }

    res.status(200).json(composition);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Composition not found' });
    }
    console.error('Error patching composition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCompositionHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteComposition(id);
    res.status(200).json({ message: 'Composition deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Composition not found' });
    }
    console.error('Error deleting composition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const duplicateCompositionHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const duplicatedComposition = await duplicateComposition(id);

    if (!duplicatedComposition) {
      return res.status(404).json({ error: 'Composition not found' });
    }

    res.status(201).json(duplicatedComposition);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Composition not found' });
    }
    console.error('Error duplicating composition:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMediaUrlsHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const validationResult = UpdateMediaUrlsSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const composition = await updateMediaUrls(id, validationResult.data.urlMappings);

    if (!composition) {
      return res.status(404).json({ error: 'Composition not found' });
    }

    res.status(200).json(composition);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Composition not found' });
    }
    console.error('Error updating media URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
