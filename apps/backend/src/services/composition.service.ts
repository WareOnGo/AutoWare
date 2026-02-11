import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface PaginationOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export const createComposition = async (compositionData: any) => {
  return await prisma.videoComposition.create({
    data: {
      composition_components: compositionData,
    },
  });
};

export const getCompositionById = async (id: string) => {
  return await prisma.videoComposition.findUnique({
    where: { id },
  });
};

export const getAllCompositions = async (options: PaginationOptions = {}) => {
  const { limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;

  return await prisma.videoComposition.findMany({
    take: limit,
    skip: offset,
    orderBy: { [sortBy]: sortOrder },
  });
};

export const updateComposition = async (id: string, compositionData: any) => {
  return await prisma.videoComposition.update({
    where: { id },
    data: {
      composition_components: compositionData,
    },
  });
};

export const patchComposition = async (id: string, partialData: any) => {
  const existing = await prisma.videoComposition.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  const merged = deepMerge(existing.composition_components, partialData);

  return await prisma.videoComposition.update({
    where: { id },
    data: {
      composition_components: merged,
    },
  });
};

export const updateMediaUrls = async (id: string, urlMappings: Record<string, string>) => {
  const existing = await prisma.videoComposition.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  const updated = { ...existing.composition_components };

  // Apply URL mappings using field paths
  // e.g., { "satDroneSection.droneVideoUrl": "https://..." }
  Object.entries(urlMappings).forEach(([path, url]) => {
    setNestedValue(updated, path, url);
  });

  return await prisma.videoComposition.update({
    where: { id },
    data: {
      composition_components: updated,
    },
  });
};

// Helper to set nested object values by path string
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

export const deleteComposition = async (id: string) => {
  return await prisma.videoComposition.delete({
    where: { id },
  });
};

export const duplicateComposition = async (id: string) => {
  const existing = await prisma.videoComposition.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  // Create a copy with a new ID and updated timestamps
  // Append " (Copy)" to the client name to indicate it's a duplicate
  const compositionData = { ...existing.composition_components };
  
  if (compositionData.intro?.clientName) {
    compositionData.intro.clientName = `${compositionData.intro.clientName} (Copy)`;
  }

  return await prisma.videoComposition.create({
    data: {
      composition_components: compositionData,
    },
  });
};

// Deep merge utility for PATCH operations
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}
