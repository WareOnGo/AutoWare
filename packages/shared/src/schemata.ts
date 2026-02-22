import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------

// Reusable schema for S3/R2 URLs and local blob URLs
const MediaUrl = z.string().refine(
  (val) => {
    // Accept empty strings (for optional/not-yet-uploaded fields)
    if (!val || val.trim() === '') return true;
    // Accept blob URLs (local file uploads)
    if (val.startsWith('blob:')) return true;
    // Accept regular URLs
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Must be a valid URL or local file" }
).or(z.literal(""));

// Lat/Long for automated map zoom
const GeoLocation = z.object({
  lat: z.number(),
  lng: z.number(),
});

// ✅ NEW: Reusable Audio Metadata Schema
// This ensures every section has the audio file + the data needed to sync it
const AudioMetaSchema = z.object({
  audioUrl: MediaUrl.optional(),  // Optional - generated via TTS from transcript
  durationInSeconds: z.number().positive(), // Critical for calculating frame counts (duration * 30fps)
  transcript: z.string(),     // The text script (used for subtitles & the editor UI)
});

// ---------------------------------------------------------------------------
// Section 1: Satellite & Drone (0-5 sec... dynamic based on audio)
// ---------------------------------------------------------------------------
export const SatDroneSchema = z.object({
  location: GeoLocation,
  droneVideoUrl: MediaUrl.optional(),
  satelliteImageUrl: MediaUrl.optional(), // NEW: Optional satellite image

  // ✅ Audio is now a core part of the section
  audio: AudioMetaSchema,

  // Optional section duration override (must be >= audio duration + 1s)
  sectionDurationInSeconds: z.number().positive().optional(),
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

  satelliteImageUrl: MediaUrl.optional(), // Satellite image from previous section

  // ✅ Audio for this section
  audio: AudioMetaSchema,

  // Optional section duration override (must be >= audio duration + 1s)
  sectionDurationInSeconds: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Section 2B: Approach Road
// ---------------------------------------------------------------------------
export const ApproachRoadSchema = z.object({
  videoUrl: MediaUrl.optional(),
  imageUrl: MediaUrl.optional(), // Alternative to video - displays for 3 seconds by default

  // ✅ Audio for this section
  audio: AudioMetaSchema,

  // Optional section duration override (must be >= audio duration + 1s)
  sectionDurationInSeconds: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Section 3A: Internal Wide Shot
// ---------------------------------------------------------------------------
export const InternalWideShotSchema = z.object({
  videoUrl: MediaUrl.optional(),
  imageUrl: MediaUrl.optional(), // Alternative to video - displays for 3 seconds by default
  specs: z.object({
    clearHeight: z.string(),
    flooringType: z.string(),
    hasVentilation: z.boolean(),
    hasInsulation: z.boolean(),
    rackingType: z.string().optional(),
  }),
  audio: AudioMetaSchema,
  sectionDurationInSeconds: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Section 3B: Internal Dock
// ---------------------------------------------------------------------------
export const InternalDockSchema = z.object({
  videoUrl: MediaUrl.optional(),
  imageUrl: MediaUrl.optional(), // Alternative to video - displays for 3 seconds by default
  audio: AudioMetaSchema,
  sectionDurationInSeconds: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Section 3C: Internal Utilities
// ---------------------------------------------------------------------------
export const InternalUtilitiesSchema = z.object({
  videoUrl: MediaUrl.optional(),
  imageUrl: MediaUrl.optional(), // Alternative to video - displays for 3 seconds by default
  featuresPresent: z.array(
    z.enum(["security_room", "canteen", "washrooms", "fire_pump_room", "driver_rest_area"])
  ),
  audio: AudioMetaSchema,
  sectionDurationInSeconds: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Section 4: External Docking
// ---------------------------------------------------------------------------
export const ExternalDockingSchema = z.object({
  dockPanVideoUrl: MediaUrl.optional(),
  imageUrl: MediaUrl.optional(), // Alternative to video - displays for 3 seconds by default
  dockCount: z.number().int().optional(),

  // ✅ Audio for this section
  audio: AudioMetaSchema,

  // Optional section duration override (must be >= audio duration + 1s)
  sectionDurationInSeconds: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Section 5: Compliances
// ---------------------------------------------------------------------------
export const ComplianceSchema = z.object({
  fireSafetyVideoUrl: MediaUrl.optional(),
  imageUrl: MediaUrl.optional(), // Alternative to video - displays for 3 seconds by default
  safetyFeatures: z.array(
    z.enum(["hydrants", "sprinklers", "alarm_system", "pump_room", "smoke_detectors"])
  ),

  // ✅ Audio for this section
  audio: AudioMetaSchema,

  // Optional section duration override (must be >= audio duration + 1s)
  sectionDurationInSeconds: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Section 6: CAD File (Architecture Diagram)
// ---------------------------------------------------------------------------
export const CadFileSchema = z.object({
  imageUrl: MediaUrl.optional(),

  // ✅ Audio for this section
  audio: AudioMetaSchema,

  // Optional section duration override (must be >= audio duration + 1s)
  sectionDurationInSeconds: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// MASTER COMPOSITION PROPS
// ---------------------------------------------------------------------------
export const CompositionProps = z.object({
  intro: z.object({
    clientName: z.string(),
    projectLocationName: z.string(),
  }),

  // The Video Sections
  satDroneSection: SatDroneSchema,
  locationSection: LocationHighlightSchema,
  approachRoadSection: ApproachRoadSchema,
  internalWideShotSection: InternalWideShotSchema,
  internalDockSection: InternalDockSchema,
  internalUtilitiesSection: InternalUtilitiesSchema,
  dockingSection: ExternalDockingSchema,
  complianceSection: ComplianceSchema,
  cadFileSection: CadFileSchema,
});

export type WarehouseVideoProps = z.infer<typeof CompositionProps>;
