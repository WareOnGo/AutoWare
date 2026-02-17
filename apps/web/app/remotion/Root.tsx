import { Composition } from "remotion";
import {
  DURATION_IN_FRAMES,
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_ID,
  COMPOSITION_WIDTH,
} from "./constants.mjs";
import { Main } from "./components/Main";
import { WarehouseVideoProps, CompositionProps } from "@repo/shared";

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
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={defaultWarehouseProps}
        schema={CompositionProps}
      />
    </>
  );
};
