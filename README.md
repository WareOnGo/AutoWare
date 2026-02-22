# Autoware — Warehouse Video Composition Platform

**Internal Tool — WareOnGo**

Autoware is WareOnGo's internal video composition and rendering platform for generating professional warehouse showcase videos. It provides a browser-based split-screen editor where team members can compose multi-section warehouse videos with satellite imagery, drone footage, internal facility tours, compliance documentation, and AI-generated voiceovers — then render them to production-quality 1080p MP4 files via Remotion.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Video Composition Pipeline](#video-composition-pipeline)
- [Editor Interface](#editor-interface)
- [Video Sections](#video-sections)
- [Section Ordering (Drag & Drop)](#section-ordering-drag--drop)
- [Schema-Driven Form Generation](#schema-driven-form-generation)
- [Media Pipeline](#media-pipeline)
- [Text-to-Speech (TTS)](#text-to-speech-tts)
- [Satellite Imagery](#satellite-imagery)
- [Backend API Reference](#backend-api-reference)
- [Database Schema](#database-schema)
- [Rendering](#rendering)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Editor UI)                     │
│  ┌──────────────────┐   ┌────────────────────────────────┐  │
│  │ Remotion Player   │   │ Schema-Driven Form Panel       │  │
│  │ (Live Preview)    │   │ • Drag-and-drop section order  │  │
│  │                   │   │ • Media uploads (video/image)  │  │
│  │ 1080p Composition │   │ • TTS transcript → audio       │  │
│  │ with transitions  │   │ • Google Maps → satellite img  │  │
│  └──────────────────┘   └────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────┐
│                    Express Backend (:5000)                   │
│  ┌──────────┐ ┌───────┐ ┌──────┐ ┌──────┐ ┌──────────────┐ │
│  │ Projects │ │ Comp. │ │ R2   │ │ TTS  │ │ Maps/Mapbox  │ │
│  │ CRUD     │ │ CRUD  │ │Upload│ │Sarvam│ │ Satellite    │ │
│  └──────────┘ └───────┘ └──────┘ └──────┘ └──────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌────────────┐    ┌────────────┐    ┌─────────────────┐
   │ Supabase   │    │ Cloudflare │    │ External APIs   │
   │ PostgreSQL │    │ R2 (S3)    │    │ • Sarvam AI TTS │
   │            │    │ Media CDN  │    │ • Mapbox Static │
   └────────────┘    └────────────┘    │ • Remotion Lambda│
                                       └─────────────────┘
```

---

## Monorepo Structure

```
autoware-monorepo/
├── apps/
│   ├── web/                          # Frontend — React Router + Remotion
│   │   ├── app/
│   │   │   ├── routes/
│   │   │   │   ├── projects.tsx      # Dashboard — project list, create, delete
│   │   │   │   ├── editor.$id.tsx    # Split-screen editor — player + form
│   │   │   │   └── worker.$.ts       # Remotion render worker
│   │   │   ├── remotion/
│   │   │   │   ├── components/
│   │   │   │   │   ├── Main.tsx              # Video orchestrator — dynamic section rendering
│   │   │   │   │   ├── TransitionWrapper.tsx  # Cross-fade transitions
│   │   │   │   │   ├── ImageDisplay.tsx       # Reusable image + audio + subtitle component
│   │   │   │   │   ├── VideoDisplay.tsx       # Reusable video + audio + subtitle component
│   │   │   │   │   └── videoSections/         # 12 section components (Intro, Outro, etc.)
│   │   │   │   ├── constants.mjs     # FPS, resolution, composition ID
│   │   │   │   └── schemata.ts       # Re-exports from @repo/shared
│   │   │   ├── components/
│   │   │   │   ├── SchemaFormGenerator.tsx  # Dynamic form from Zod schemas (with DnD)
│   │   │   │   ├── SectionOrderEditor.tsx   # Standalone section order UI (legacy)
│   │   │   │   ├── MediaUpload.tsx          # Unified video/image upload
│   │   │   │   ├── TranscriptInput.tsx      # TTS transcript input with generate button
│   │   │   │   ├── GoogleMapsInput.tsx      # Google Maps URL → satellite image
│   │   │   │   ├── ProjectCard.tsx          # Dashboard project card
│   │   │   │   └── ui/                      # Radix-based UI primitives
│   │   │   └── lib/
│   │   │       ├── api.ts            # API client (compositions, TTS, maps, R2)
│   │   │       ├── upload.ts         # Batch upload via presigned URLs
│   │   │       └── utils.ts          # Duration calculation helpers
│   │   └── package.json
│   │
│   └── backend/                      # Backend — Express + Prisma
│       ├── src/
│       │   ├── index.ts              # Express app, route mounting
│       │   ├── routes/
│       │   │   ├── composition.routes.ts   # CRUD for VideoComposition
│       │   │   ├── prioject.routes.ts      # Legacy project routes
│       │   │   ├── render.routes.ts        # Remotion Lambda render triggers
│       │   │   ├── r2.routes.ts            # Presigned URL generation for R2
│       │   │   ├── tts.routes.ts           # Sarvam AI text-to-speech
│       │   │   ├── maps.routes.ts          # Mapbox satellite image generation
│       │   │   └── warehouse.routes.ts     # Warehouse data routes
│       │   ├── controllers/          # Route handlers
│       │   ├── services/             # Business logic layer
│       │   └── generated/prisma/     # Prisma client (auto-generated)
│       ├── prisma/
│       │   └── schema.prisma         # Database schema
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared package — @repo/shared
│       └── src/
│           ├── schemata.ts           # Zod schemas for all video sections
│           ├── constants.ts          # Shared constants (FPS, resolution)
│           └── types.ts              # Shared TypeScript types
│
├── package.json                      # Monorepo root — npm workspaces
└── package-lock.json
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, React Router 7 | SPA with file-based routing |
| **Video Engine** | Remotion 4.0 | Programmatic video composition & rendering |
| **Styling** | TailwindCSS 4, Radix UI | Utility-first CSS with accessible UI primitives |
| **Forms** | React Hook Form + Zod | Type-safe forms with schema validation |
| **Drag & Drop** | @dnd-kit | Section reordering in the editor |
| **Backend** | Express 4, TypeScript | REST API server |
| **Database** | PostgreSQL (Supabase) | Composition data, warehouse records |
| **ORM** | Prisma 7 | Type-safe database client |
| **Object Storage** | Cloudflare R2 (S3-compatible) | Video, image, and audio asset storage |
| **TTS** | Sarvam AI | Hindi/English text-to-speech narration |
| **Maps** | Mapbox Static Images API | Satellite imagery from Google Maps URLs |
| **Rendering** | Remotion Lambda (AWS) | Serverless video rendering at scale |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (workspaces support)
- **PostgreSQL** (Supabase or local)
- Access to Cloudflare R2, Sarvam AI, and Mapbox accounts

### Installation

```bash
git clone <repository-url>
cd Autoware
npm install
```

### Database Setup

```bash
cd apps/backend
npx prisma db push          # Sync schema with database
npx prisma generate         # Generate Prisma client
```

### Running Locally

```bash
# From the monorepo root — starts both frontend (:3000) and backend (:5000)
npm run dev
```

This runs:
- **Frontend** → `http://localhost:3000` (React Router dev server)
- **Backend** → `http://localhost:5000` (Express API server)

### Building for Production

```bash
npm run build               # Builds all workspaces
```

---

## Environment Variables

Create `apps/backend/.env` with the following variables:

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler URL) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name (e.g., `autoware`) |
| `R2_PUBLIC_URL` | R2 public CDN URL |
| `OPENAI_API_KEY` | OpenAI API key (used for fallback TTS) |
| `MAPBOX_ACCESS_TOKEN` | Mapbox access token for satellite imagery |
| `SARVAM_API_KEY` | Sarvam AI API key for Hindi/English TTS |

---

## Video Composition Pipeline

Each warehouse showcase video follows this pipeline:

```
1. Create Project → Empty composition in DB
2. Fill Form      → Upload media, write transcripts, set durations
3. Generate TTS   → Sarvam AI converts transcripts to audio files
4. Preview        → Live Remotion Player in the editor
5. Reorder        → Drag-and-drop sections into desired sequence
6. Save           → Persist composition data to backend
7. Render         → Remotion Lambda renders to 1080p MP4
8. Download       → MP4 available via R2 CDN
```

### Video Specifications

| Property | Value |
|----------|-------|
| Resolution | 1920 × 1080 (Full HD) |
| Frame Rate | 30 FPS |
| Format | MP4 (H.264) |
| Transitions | 10-frame (~0.33s) cross-fade between sections |
| Background Music | Looped ambient track |

---

## Editor Interface

The editor (`/editor/:id`) provides a split-screen layout:

```
┌─────────────────────┬─────────────────────────────────────┐
│                     │  Section Order (Drag & Drop)        │
│     Remotion        │  ┌─ ⠿ 1  Satellite & Drone ──────┐ │
│     Player          │  ├─ ⠿ 2  Location Highlights ────┤ │
│                     │  ├─ ⠿ 3  Approach Road ──────────┤ │
│     (35% width)     │  ├─ ⠿ 4  CAD File / Architecture ┤ │
│                     │  ├─ ⠿ 5  Internal Wide Shot ─────┤ │
│     Live Preview    │  └─ ⠿ ...                        ┘ │
│     with Controls   │                                     │
│                     │  ┌─ ▼ Intro ────────────────────┐   │
│                     │  │  Client Name: [________]     │   │
│                     │  │  Location:    [________]     │   │
│                     │  └──────────────────────────────┘   │
│                     │                                     │
│                     │  ┌─ ▼ Satellite & Drone ────────┐   │
│                     │  │  Media Upload: [Choose...]    │   │
│                     │  │  Transcript:   [________]    │   │
│                     │  │  [🔊 Generate Speech]        │   │
│                     │  └──────────────────────────────┘   │
│                     │           (65% width)               │
├─────────────────────┴─────────────────────────────────────┤
│  [Save Project]  [Render Video]                           │
└───────────────────────────────────────────────────────────┘
```

**Key Features:**
- Real-time preview updates as you edit
- Auto-pause during drag-and-drop reordering
- Schema-driven form — new sections automatically get form fields
- Batch file uploads with presigned URLs
- TTS generation from transcripts with a single click
- Satellite image generation from Google Maps URLs

---

## Video Sections

The video is composed of fixed **Intro** and **Outro** sections bookending a configurable set of middle sections:

| # | Section | Type | Description |
|---|---------|------|-------------|
| — | **Intro** | Fixed | Client name, project location branding |
| 1 | Satellite & Drone | Video/Image | Satellite zoom-out + drone footage |
| 2 | Location Highlights | Image | Location POIs with satellite overlay |
| 3 | Approach Road | Video/Image | Road approach to the warehouse |
| 4 | CAD File / Architecture | Image | Architectural diagrams and CAD files |
| 5 | Internal Wide Shot | Video/Image | Full interior panoramic view |
| 6 | Internal Dock | Video/Image | Loading dock facility |
| 7 | Internal Utilities | Video/Image | Utilities infrastructure |
| 8 | Docking & Parking | Video/Image | External docking and parking areas |
| 9 | Compliances | Video/Image | Safety and compliance documentation |
| — | **Outro** | Fixed | WareOnGo closing branding |

Each section supports:
- **Media**: Video or image upload (unified `MediaUpload` component)
- **Audio**: Transcript → TTS-generated voiceover with subtitle overlay
- **Duration**: Auto-calculated from audio length + padding, or manual override

---

## Section Ordering (Drag & Drop)

Sections 1–9 can be freely reordered via drag-and-drop directly in the editor's accordion UI.

**Implementation:**
- `sectionOrder` array stored in `CompositionProps` schema
- `Main.tsx` renders sections dynamically from `sectionOrder`
- `@dnd-kit/core` + `@dnd-kit/sortable` for the DnD UI
- Drag handles (⠿) on each accordion section trigger
- Sections auto-collapse when dragging begins
- Video player pauses during reorder to prevent jitter
- Order persists only on Save (not auto-saved)
- Old projects without `sectionOrder` get the default order via migration fallback

---

## Schema-Driven Form Generation

Forms are generated automatically from Zod schemas. To add a new section:

1. **Define the schema** in `packages/shared/src/schemata.ts`:
   ```typescript
   export const MyNewSchema = z.object({
     imageUrl: MediaUrl.optional(),
     audio: AudioMetaSchema,
     sectionDurationInSeconds: z.number().positive().optional(),
   });
   ```

2. **Add to `CompositionProps`**:
   ```typescript
   myNewSection: MyNewSchema,
   ```

3. **Add key to `SECTION_KEYS`** and **`SECTION_DISPLAY_NAMES`**

4. **Create the component** in `videoSections/`

5. **Add a `case` to `renderSection()`** in `Main.tsx`

6. **Add default values** and **migration fallback** in `editor.$id.tsx`

The form UI (inputs, uploads, TTS buttons) appears automatically. No manual form code needed.

---

## Media Pipeline

### Upload Flow

```
Browser                         Backend                    R2
  │                               │                        │
  ├─ POST /api/r2/presigned-urls ─▶│                        │
  │       (batch request)          │                        │
  │◀── presigned URLs + CDN URLs ──┤                        │
  │                               │                        │
  ├─── PUT (direct upload) ───────────────────────────────▶│
  │                               │                        │
  ├─ PATCH /api/composition/:id ──▶│                        │
  │       (save CDN URLs)          │                        │
```

- **Presigned URLs** — Files upload directly from browser to R2 (no backend proxy)
- **CDN URLs** — Stored in the composition JSON for Remotion to reference
- **Supported formats** — MP4, WebM, MOV (video); JPG, PNG, WebP (image); MP3, WAV (audio)

---

## Text-to-Speech (TTS)

Powered by **Sarvam AI** for Hindi /English voiceover generation.

**Flow:**
1. User enters transcript text in the form
2. Clicks "Generate Speech" button
3. Backend calls Sarvam AI API → receives audio buffer
4. Audio uploaded to R2 → CDN URL returned
5. Audio URL + duration stored in composition data
6. Remotion renders the audio with synchronized subtitles

**Configuration per transcript:**
- Voice selection
- Language (Hindi/English)
- Speed multiplier
- Sample rate

---

## Satellite Imagery

Powered by **Mapbox Static Images API** (`satellite-streets-v12` style).

**Flow:**
1. User pastes a Google Maps URL
2. Backend parses coordinates (supports multiple URL formats + geocoding fallback)
3. Mapbox Static Images API generates a satellite image
4. Image uploaded to R2 → CDN URL returned
5. Used in the Satellite & Drone section with zoom-out animation

---

## Backend API Reference

### Composition Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/composition` | List all compositions (sorted by created_at desc) |
| `GET` | `/api/composition/:id` | Get single composition |
| `POST` | `/api/composition` | Create new composition |
| `PATCH` | `/api/composition/:id` | Update composition (partial) |
| `DELETE` | `/api/composition/:id` | Delete composition |
| `POST` | `/api/composition/:id/duplicate` | Duplicate composition |

### Media & Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/r2/presigned-urls/batch` | Generate batch presigned URLs for upload |
| `POST` | `/api/tts/generate-audio-sarvam` | Generate TTS audio from transcript |
| `POST` | `/api/maps/satellite-image` | Generate satellite image from Google Maps URL |

### Rendering

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/render` | Trigger Remotion Lambda render |
| `POST` | `/progress/:id` | Check render progress |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/health` | Server health check |

---

## Database Schema

The primary models in `prisma/schema.prisma`:

### `VideoComposition`
Stores each video project's complete composition data as JSON.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `composition_components` | JSON | Full `WarehouseVideoProps` object |
| `created_at` | DateTime | Auto-set on creation |
| `updated_at` | DateTime | Auto-updated on modification |

### `Warehouse`
Warehouse listing data with full-text search indexes.

### `WarehouseData`
Extended warehouse metadata (coordinates, compliance details, dimensions).

---

## Development Workflow

### Adding a New Video Section

1. Define Zod schema in `packages/shared/src/schemata.ts`
2. Add to `CompositionProps` and `SECTION_KEYS`
3. Create component in `apps/web/app/remotion/components/videoSections/`
4. Add render case in `Main.tsx` → `renderSection()`
5. Add defaults + migration in `editor.$id.tsx`
6. Run `npx tsc --noEmit` in both `packages/shared` and `apps/web`

### Type Checking

```bash
# Shared package
cd packages/shared && npx tsc --noEmit

# Web app (may need extra memory)
cd apps/web && NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit
```

### Remotion Studio

For isolated video development:
```bash
cd apps/web && npm run remotion:studio
```

---

## Deployment

### Backend
Standard Node.js deployment (Docker, Railway, etc.):
```bash
cd apps/backend
npm run build
node dist/index.js
```

### Frontend
React Router production build:
```bash
cd apps/web
npm run build
npm run start
```

### Remotion Lambda
Deploy the render function to AWS Lambda:
```bash
cd apps/web
npm run remotion:deploy
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Zod schemas as single source of truth** | Drives both form generation and Remotion type safety |
| **JSON composition storage** | Flexible schema evolution without DB migrations |
| **Direct-to-R2 uploads** | Eliminates backend as file proxy, reduces latency |
| **Dynamic section rendering** | `sectionOrder` array enables reordering without code changes |
| **Sarvam AI for TTS** | Hindi language support critical for Indian warehouse market |
| **Mapbox over OSM** | Higher quality satellite imagery with street labels |

---

*Autoware v1 — Built for WareOnGo · Internal Use Only*
