import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------

// Reusable schema for S3/R2 URLs
const MediaUrl = z.string().url({ message: "Must be a valid S3/R2 URL" });

// Lat/Long for automated map zoom
const GeoLocation = z.object({
  lat: z.number(),
  lng: z.number(),
});

// ✅ NEW: Reusable Audio Metadata Schema
// This ensures every section has the audio file + the data needed to sync it
const AudioMetaSchema = z.object({
  audioUrl: MediaUrl,         // The MP3 file from ElevenLabs/OpenAI
  durationInSeconds: z.number().positive(), // Critical for calculating frame counts (duration * 30fps)
  transcript: z.string(),     // The text script (used for subtitles & the editor UI)
});

// ---------------------------------------------------------------------------
// Section 1: Satellite & Drone (0-5 sec... dynamic based on audio)
// ---------------------------------------------------------------------------
export const SatDroneSchema = z.object({
  location: GeoLocation, 
  droneVideoUrl: MediaUrl.optional(),
  
  // ✅ Audio is now a core part of the section
  audio: AudioMetaSchema, 
});

// ---------------------------------------------------------------------------
// Section 2: Location Highlights
// ---------------------------------------------------------------------------
export const LocationHighlightSchema = z.object({
  nearbyPoints: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["road", "airport", "railway", "port", "hospital", "other"]),
      distanceKm: z.number(),
    })
  ).max(4),

  approachRoadVideoUrl: MediaUrl.optional(),
  
  // ✅ Audio for this section
  audio: AudioMetaSchema,
});

// ---------------------------------------------------------------------------
// Section 3: Internal Storage
// ---------------------------------------------------------------------------
export const InternalStorageSchema = z.object({
  wideShotVideoUrl: MediaUrl,
  specs: z.object({
    clearHeight: z.string(),
    flooringType: z.string(),
    hasVentilation: z.boolean(),
    hasInsulation: z.boolean(),
    rackingType: z.string().optional(),
  }),
  internalDockVideoUrl: MediaUrl,
  utilities: z.object({
    videoUrl: MediaUrl,
    featuresPresent: z.array(
      z.enum(["security_room", "canteen", "washrooms", "fire_pump_room", "driver_rest_area"])
    ),
  }),

  // ✅ Audio for this section
  audio: AudioMetaSchema,
});

// ---------------------------------------------------------------------------
// Section 4: External Docking
// ---------------------------------------------------------------------------
export const ExternalDockingSchema = z.object({
  dockPanVideoUrl: MediaUrl,
  dockCount: z.number().int().optional(),

  // ✅ Audio for this section
  audio: AudioMetaSchema,
});

// ---------------------------------------------------------------------------
// Section 5: Compliances
// ---------------------------------------------------------------------------
export const ComplianceSchema = z.object({
  fireSafetyVideoUrl: MediaUrl,
  safetyFeatures: z.array(
    z.enum(["hydrants", "sprinklers", "alarm_system", "pump_room", "smoke_detectors"])
  ),

  // ✅ Audio for this section
  audio: AudioMetaSchema,
});

// ---------------------------------------------------------------------------
// MASTER COMPOSITION PROPS
// ---------------------------------------------------------------------------
export const CompositionProps = z.object({
  meta: z.object({
    clientName: z.string(),
    projectLocationName: z.string(),
  }),

  // The Video Sections
  sectionSatDrone: SatDroneSchema,
  sectionLocation: LocationHighlightSchema,
  sectionInternal: InternalStorageSchema,
  sectionDocking: ExternalDockingSchema,
  sectionCompliance: ComplianceSchema,
});

export type WarehouseVideoProps = z.infer<typeof CompositionProps>;
