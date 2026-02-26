import { Composition } from "remotion";
import {
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_ID,
  COMPOSITION_WIDTH,
} from "./constants.mjs";
import { Main } from "./components/Main";
import { WarehouseVideoProps, CompositionProps, SECTION_KEYS } from "@repo/shared";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

// Helper function to calculate total video duration
function calculateTotalDuration(props: WarehouseVideoProps): number {
  const fps = COMPOSITION_FPS;
  const TRANSITION_DURATION = 10; // Must match Main.tsx

  const calculateSectionDuration = (audioDuration: number, userSetDuration?: number) => {
    if (!audioDuration || audioDuration <= 0) {
      return userSetDuration || 0;
    }
    const minimumDuration = audioDuration + 1.0;
    return Math.max(userSetDuration || minimumDuration, minimumDuration);
  };

  const introDuration = 5 * fps;
  const outroDuration = 5 * fps;

  // Collect non-zero section durations
  const sectionDurations: number[] = [];

  const addSection = (audioDuration: number, userSetDuration?: number) => {
    const dur = calculateSectionDuration(audioDuration, userSetDuration) * fps;
    if (dur > 0) sectionDurations.push(dur);
  };

  addSection(props.satDroneSection.audio.durationInSeconds || 0, props.satDroneSection.sectionDurationInSeconds);
  addSection(props.locationSection.audio.durationInSeconds || 0, props.locationSection.sectionDurationInSeconds);
  addSection(props.approachRoadSection.audio.durationInSeconds || 0, props.approachRoadSection.sectionDurationInSeconds);
  addSection(props.internalWideShotSection.audio.durationInSeconds || 0, props.internalWideShotSection.sectionDurationInSeconds);
  addSection(props.internalDockSection.audio.durationInSeconds || 0, props.internalDockSection.sectionDurationInSeconds);
  addSection(props.internalUtilitiesSection.audio.durationInSeconds || 0, props.internalUtilitiesSection.sectionDurationInSeconds);
  addSection(props.dockingSection.audio.durationInSeconds || 0, props.dockingSection.sectionDurationInSeconds);
  addSection(props.complianceSection.audio.durationInSeconds || 0, props.complianceSection.sectionDurationInSeconds);

  // CAD section: duration is the sum of annotation layer padded durations
  const cadAnnotations = props.cadFileSection?.annotations || [];
  const cadTotalPaddedDuration = cadAnnotations.reduce(
    (sum, layer, index) => {
      const layerDur = (layer.audio?.durationInSeconds || 0) + 1.0;
      return sum + layerDur - (index > 0 ? 0.5 : 0);
    },
    0
  );
  if (cadTotalPaddedDuration > 0) {
    const cadDur = calculateSectionDuration(Math.max(cadTotalPaddedDuration - 1.0, 0)) * fps;
    if (cadDur > 0) sectionDurations.push(cadDur);
  }

  const totalSectionDuration = sectionDurations.reduce((a, b) => a + b, 0);

  // Subtract transition overlaps (intro→first, between sections, last→outro)
  const numTransitions = sectionDurations.length > 0 ? sectionDurations.length + 1 : 0;
  const transitionOverlap = numTransitions * TRANSITION_DURATION;

  return introDuration + totalSectionDuration + outroDuration - transitionOverlap;
}

// Placeholder data using the master schema from shared package
const defaultWarehouseProps: WarehouseVideoProps = {
  intro: {
    clientName: "Acme Logistics Inc.",
    projectLocationName: "Greater Noida Industrial Hub",
  },

  // Section 1: Satellite & Drone
  satDroneSection: {
    location: {
      lat: 28.4744,
      lng: 77.5040,
    },
    droneVideoUrl: "https://storage.example.com/drone-footage.mp4",
    audio: {
      audioUrl: "https://storage.example.com/audio/sat-drone-voiceover.mp3",
      durationInSeconds: 5,
      transcript: "Welcome to our state-of-the-art warehouse facility located in Greater Noida. This aerial view showcases the strategic positioning and modern infrastructure.",
    },
  },

  // Section 2: Location Highlights
  locationSection: {
    nearbyPoints: [
      { name: "NH-24 Highway", type: "road", distanceKm: 2.5 },
      { name: "IGI Airport", type: "airport", distanceKm: 45 },
      { name: "Ghaziabad Railway Station", type: "railway", distanceKm: 15 },
      { name: "Multispecialty Hospital", type: "hospital", distanceKm: 3 },
    ],
    audio: {
      audioUrl: "https://storage.example.com/audio/location-voiceover.mp3",
      durationInSeconds: 10,
      transcript: "Strategically located with excellent connectivity. Just 2.5 kilometers from NH-24, 45 kilometers from IGI Airport, and close to major railway stations and healthcare facilities.",
    },
  },

  // Section 2B: Approach Road
  approachRoadSection: {
    videoUrl: "https://storage.example.com/approach-road.mp4",
    imageUrl: "",
    audio: {
      audioUrl: "https://storage.example.com/audio/approach-voiceover.mp3",
      durationInSeconds: 5,
      transcript: "Approaching the facility via well-maintained access roads.",
    },
  },

  // Section 3: Internal Storage
  internalWideShotSection: {
    videoUrl: "https://storage.example.com/internal-wide.mp4",
    imageUrl: "",
    specs: {
      clearHeight: "32 feet",
      flooringType: "VDF (Vacuum Dewatered Flooring)",
      hasVentilation: true,
      hasInsulation: true,
      rackingType: "Selective Pallet Racking",
    },
    audio: {
      audioUrl: "https://storage.example.com/audio/internal-wide-voiceover.mp3",
      durationInSeconds: 8,
      transcript: "The facility features 32 feet clear height with VDF flooring, complete ventilation and insulation.",
    },
  },

  internalDockSection: {
    videoUrl: "https://storage.example.com/internal-dock.mp4",
    imageUrl: "",
    audio: {
      audioUrl: "https://storage.example.com/audio/internal-dock-voiceover.mp3",
      durationInSeconds: 5,
      transcript: "Internal docking facilities for efficient loading operations.",
    },
  },

  internalUtilitiesSection: {
    videoUrl: "https://storage.example.com/utilities.mp4",
    imageUrl: "",
    featuresPresent: ["security_room", "canteen", "washrooms", "fire_pump_room", "driver_rest_area"],
    audio: {
      audioUrl: "https://storage.example.com/audio/utilities-voiceover.mp3",
      durationInSeconds: 7,
      transcript: "Amenities include security room, canteen, modern washrooms, fire pump room, and dedicated driver rest area.",
    },
  },

  // Section 4: External Docking
  dockingSection: {
    dockPanVideoUrl: "https://storage.example.com/dock-pan.mp4",
    imageUrl: "",
    dockCount: 12,
    audio: {
      audioUrl: "https://storage.example.com/audio/docking-voiceover.mp3",
      durationInSeconds: 10,
      transcript: "Our facility is equipped with 12 modern loading docks, ensuring efficient cargo handling and quick turnaround times for logistics operations.",
    },
  },

  // Section 5: Compliances
  complianceSection: {
    fireSafetyVideoUrl: "https://storage.example.com/fire-safety.mp4",
    imageUrl: "",
    safetyFeatures: ["hydrants", "sprinklers", "alarm_system", "pump_room", "smoke_detectors"],
    audio: {
      audioUrl: "https://storage.example.com/audio/compliance-voiceover.mp3",
      durationInSeconds: 10,
      transcript: "Fully compliant with all safety regulations. Features include fire hydrants, automated sprinkler systems, advanced alarm systems, dedicated pump room, and smoke detection throughout the facility.",
    },
  },

  // Section 6: CAD File
  cadFileSection: {
    imageUrl: "",
    annotations: [],
  },

  sectionOrder: [...SECTION_KEYS],
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={Main}
        durationInFrames={calculateTotalDuration(defaultWarehouseProps)}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={defaultWarehouseProps}
        schema={CompositionProps}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: calculateTotalDuration(props),
          };
        }}
      />
    </>
  );
};
