import { Sequence, Audio, Loop, staticFile } from "remotion";
import { Intro } from "./videoSections/Intro";
import { Outro } from "./videoSections/Outro";
import { SatDrone } from "./videoSections/SatDrone";
import { LocationVid } from "./videoSections/Location";
import { ApproachRoad } from "./videoSections/ApproachRoad";
import { InternalWideShot } from "./videoSections/InternalWideShot";
import { InternalDock } from "./videoSections/InternalDock";
import { InternalUtilities } from "./videoSections/InternalUtilities";
import { DockingParkingVid } from "./videoSections/DockingParkingVid";
import { CompliancesVid } from "./videoSections/CompliancesVid";
import { CadFile } from "./videoSections/CadFile";

import { WarehouseVideoProps, SECTION_KEYS, type SectionKey } from "@repo/shared";

// Helper function to calculate section duration with padding
function calculateSectionDuration(
  audioDuration: number,
  userSetDuration?: number
) {
  if (!audioDuration || audioDuration <= 0) {
    const duration = userSetDuration || 0;
    return {
      audioDuration: 0,
      minimumDuration: 0,
      actualDuration: duration,
      startPadding: 0,
      endPadding: 0,
    };
  }

  const minimumDuration = audioDuration + 1.0;
  const actualDuration = Math.max(userSetDuration || minimumDuration, minimumDuration);
  const extraTime = actualDuration - audioDuration;
  const padding = extraTime / 2;

  return {
    audioDuration,
    minimumDuration,
    actualDuration,
    startPadding: padding,
    endPadding: padding,
  };
}

import { TransitionWrapper } from "./TransitionWrapper";

// Section renderer: given a section key, returns the JSX for that section
function renderSection(
  key: SectionKey,
  props: WarehouseVideoProps,
  startPadding: number,
): React.ReactNode {
  switch (key) {
    case "satDroneSection":
      return (
        <SatDrone
          dronevideourl={props.satDroneSection.droneVideoUrl || "Test"}
          satimageurl={props.satDroneSection.satelliteImageUrl}
          latitude={props.satDroneSection.location.lat}
          longitude={props.satDroneSection.location.lng}
          audio={props.satDroneSection.audio}
          startPaddingInSeconds={startPadding}
        />
      );
    case "locationSection":
      return (
        <LocationVid
          {...props.locationSection}
          satelliteImageUrl={props.satDroneSection.satelliteImageUrl}
          startPaddingInSeconds={startPadding}
        />
      );
    case "approachRoadSection":
      return (
        <ApproachRoad
          {...props.approachRoadSection}
          startPaddingInSeconds={startPadding}
        />
      );
    case "cadFileSection":
      return (
        <CadFile
          {...props.cadFileSection}
          startPaddingInSeconds={startPadding}
        />
      );
    case "internalWideShotSection":
      return (
        <InternalWideShot
          {...props.internalWideShotSection}
          startPaddingInSeconds={startPadding}
        />
      );
    case "internalDockSection":
      return (
        <InternalDock
          {...props.internalDockSection}
          startPaddingInSeconds={startPadding}
        />
      );
    case "internalUtilitiesSection":
      return (
        <InternalUtilities
          {...props.internalUtilitiesSection}
          startPaddingInSeconds={startPadding}
        />
      );
    case "dockingSection":
      return (
        <DockingParkingVid
          {...props.dockingSection}
          startPaddingInSeconds={startPadding}
        />
      );
    case "complianceSection":
      return (
        <CompliancesVid
          {...props.complianceSection}
          startPaddingInSeconds={startPadding}
        />
      );
    default:
      return null;
  }
}

// Get audio duration and user-set duration for any section key
function getSectionAudioInfo(key: SectionKey, props: WarehouseVideoProps) {
  // CAD section: duration is the sum of its annotation layers' audio durations
  if (key === "cadFileSection") {
    const annotations = props.cadFileSection.annotations || [];
    const totalPaddedDuration = annotations.reduce(
      (sum, layer, index) => {
        const layerDur = (layer.audio?.durationInSeconds || 0) + 1.0;
        return sum + layerDur - (index > 0 ? 0.5 : 0);
      },
      0
    );
    return {
      audioDuration: Math.max(totalPaddedDuration - 1.0, 0),
      userSetDuration: undefined, // no override for CAD — always sum of children
    };
  }

  const section = props[key] as any;
  return {
    audioDuration: section?.audio?.durationInSeconds || 0,
    userSetDuration: section?.sectionDurationInSeconds,
  };
}

export const Main: React.FC<WarehouseVideoProps> = (props) => {
  const fps = 30;
  const TRANSITION_DURATION = 10; // 0.33s overlap

  // Fallback if props are undefined
  if (!props || !props.intro) {
    return (
      <div style={{ color: 'red', padding: 20 }}>
        ERROR: Props not passed correctly. Props: {JSON.stringify(props)}
      </div>
    );
  }

  // Use sectionOrder from props, falling back to default SECTION_KEYS
  const sectionOrder: SectionKey[] = (props.sectionOrder && props.sectionOrder.length > 0
    ? props.sectionOrder
    : [...SECTION_KEYS]) as SectionKey[];

  const introDuration = 5 * fps;
  const outroDuration = 5 * fps;

  // Calculate duration for each section based on its audio
  const sectionCalcs = new Map<SectionKey, ReturnType<typeof calculateSectionDuration>>();
  for (const key of sectionOrder) {
    const { audioDuration, userSetDuration } = getSectionAudioInfo(key, props);
    sectionCalcs.set(key, calculateSectionDuration(audioDuration, userSetDuration));
  }

  // Calculate start times dynamically based on section order
  const sectionTimings: { key: SectionKey; start: number; duration: number; startPadding: number }[] = [];
  let currentStart = introDuration - TRANSITION_DURATION;

  for (const key of sectionOrder) {
    const calc = sectionCalcs.get(key)!;
    const durationInFrames = calc.actualDuration * fps;
    // Skip sections with zero duration (e.g. CAD section with no annotations)
    if (durationInFrames <= 0) continue;
    sectionTimings.push({
      key,
      start: currentStart,
      duration: durationInFrames,
      startPadding: calc.startPadding,
    });
    currentStart = currentStart + durationInFrames - TRANSITION_DURATION;
  }

  const outroStart = currentStart;
  const totalDuration = outroStart + outroDuration;

  return (
    <>
      {/* Intro */}
      <Sequence from={0} durationInFrames={introDuration}>
        <TransitionWrapper transitionDuration={TRANSITION_DURATION} sequenceDuration={introDuration}>
          <Intro clientname={props.intro.clientName} region={props.intro.projectLocationName} />
        </TransitionWrapper>
      </Sequence>

      {/* Dynamic sections in user-defined order */}
      {sectionTimings.map(({ key, start, duration, startPadding }) => (
        <Sequence key={key} from={start} durationInFrames={Math.max(1, Math.round(duration))}>
          <TransitionWrapper transitionDuration={TRANSITION_DURATION} sequenceDuration={duration}>
            {renderSection(key, props, startPadding)}
          </TransitionWrapper>
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={outroStart} durationInFrames={outroDuration}>
        <TransitionWrapper transitionDuration={TRANSITION_DURATION} sequenceDuration={outroDuration}>
          <Outro />
        </TransitionWrapper>
      </Sequence>

      {/* Background Music */}
      <Loop durationInFrames={totalDuration}>
        <Audio
          src={staticFile("audio/backgroundmusic.mp3")}
          volume={0.02}
        />
      </Loop>
    </>
  );
};
