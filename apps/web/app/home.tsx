import { Player } from "@remotion/player";
import { useMemo } from "react";
import {
  DURATION_IN_FRAMES,
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
} from "./remotion/constants.mjs";
import "./app.css";
import { Main } from "./remotion/components/Main";
import { Spacing } from "./components/Spacing";
import { Tips } from "./components/Tips";
import { WarehouseVideoProps } from "@repo/shared";

export default function Index() {
  // Use the warehouse video props structure
  const inputProps: WarehouseVideoProps = useMemo(() => {
    return {
      intro: {
        clientName: "Acme Logistics Inc.",
        projectLocationName: "Greater Noida Industrial Hub",
      },
      satDroneSection: {
        location: { lat: 28.4744, lng: 77.5040 },
        droneVideoUrl: "https://storage.example.com/drone-footage.mp4",
        audio: {
          audioUrl: "https://storage.example.com/audio/sat-drone-voiceover.mp3",
          durationInSeconds: 5,
          transcript: "Welcome to our state-of-the-art warehouse facility located in Greater Noida.",
        },
      },
      locationSection: {
        nearbyPoints: [
          { name: "NH-24 Highway", type: "road" as const, distanceKm: 2.5 },
          { name: "IGI Airport", type: "airport" as const, distanceKm: 45 },
          { name: "Ghaziabad Railway Station", type: "railway" as const, distanceKm: 15 },
          { name: "Multispecialty Hospital", type: "hospital" as const, distanceKm: 3 },
        ],
        approachRoadVideoUrl: "https://storage.example.com/approach-road.mp4",
        audio: {
          audioUrl: "https://storage.example.com/audio/location-voiceover.mp3",
          durationInSeconds: 10,
          transcript: "Strategically located with excellent connectivity.",
        },
      },
      internalSection: {
        wideShotVideoUrl: "https://storage.example.com/internal-wide.mp4",
        specs: {
          clearHeight: "32 feet",
          flooringType: "VDF (Vacuum Dewatered Flooring)",
          hasVentilation: true,
          hasInsulation: true,
          rackingType: "Selective Pallet Racking",
        },
        internalDockVideoUrl: "https://storage.example.com/internal-dock.mp4",
        utilities: {
          videoUrl: "https://storage.example.com/utilities.mp4",
          featuresPresent: ["security_room" as const, "canteen" as const, "washrooms" as const, "fire_pump_room" as const, "driver_rest_area" as const],
        },
        audio: {
          audioUrl: "https://storage.example.com/audio/internal-voiceover.mp4",
          durationInSeconds: 15,
          transcript: "The facility features 32 feet clear height with VDF flooring.",
        },
      },
      dockingSection: {
        dockPanVideoUrl: "https://storage.example.com/dock-pan.mp4",
        dockCount: 12,
        audio: {
          audioUrl: "https://storage.example.com/audio/docking-voiceover.mp3",
          durationInSeconds: 10,
          transcript: "Our facility is equipped with 12 modern loading docks.",
        },
      },
      complianceSection: {
        fireSafetyVideoUrl: "https://storage.example.com/fire-safety.mp4",
        safetyFeatures: ["hydrants" as const, "sprinklers" as const, "alarm_system" as const, "pump_room" as const, "smoke_detectors" as const],
        audio: {
          audioUrl: "https://storage.example.com/audio/compliance-voiceover.mp3",
          durationInSeconds: 10,
          transcript: "Fully compliant with all safety regulations.",
        },
      },
    };
  }, []);

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5">
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10 mt-16">
          <Player
            component={Main}
            inputProps={inputProps}
            durationInFrames={DURATION_IN_FRAMES}
            fps={COMPOSITION_FPS}
            compositionHeight={COMPOSITION_HEIGHT}
            compositionWidth={COMPOSITION_WIDTH}
            style={{
              // Can't use tailwind class for width since player's default styles take presedence over tailwind's,
              // but not over inline styles
              width: "100%",
            }}
            controls
            autoPlay
            loop
            renderLoading={() => null}
            errorFallback={() => null}
          />
        </div>
        {/* RenderControls temporarily removed - will be updated to work with warehouse props */}
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Tips></Tips>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Tips></Tips>
      </div>
    </div>
  );
}
