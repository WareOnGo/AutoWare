import { Sequence } from "remotion";
import { Intro } from "./videoSections/Intro";
import { Outro } from "./videoSections/Outro";
import { SatDrone } from "./videoSections/SatDrone";
import { LocationVid } from "./videoSections/Location";
import { InternalVid } from "./videoSections/InternalVid";
import { DockingParkingVid } from "./videoSections/DockingParkingVid";
import { CompliancesVid } from "./videoSections/CompliancesVid";

import { WarehouseVideoProps } from "@repo/shared";

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

export const Main: React.FC<WarehouseVideoProps> = (props) => {
  const fps = 30;

  // Debug: Check if props are being passed
  console.log("Main component props:", props);
  console.log("Props meta:", props?.intro);

  // Fallback if props are undefined
  if (!props || !props.intro) {
    return (
      <div style={{ color: 'red', padding: 20 }}>
        ERROR: Props not passed correctly. Props: {JSON.stringify(props)}
      </div>
    );
  }

  const introDuration = 5 * fps;
  
  // Calculate section durations with padding
  const satDroneCalc = calculateSectionDuration(
    props.satDroneSection.audio.durationInSeconds || 0,
    props.satDroneSection.sectionDurationInSeconds
  );
  
  // For location section, add approach video duration to the minimum required duration
  const locationMinimumDuration = (props.locationSection.audio.durationInSeconds || 0) + 
    (props.locationSection.approachRoadVideoDurationInSeconds || 0);
  const locationCalc = calculateSectionDuration(
    locationMinimumDuration,
    props.locationSection.sectionDurationInSeconds
  );
  
  const internalCalc = calculateSectionDuration(
    props.internalSection.audio.durationInSeconds || 0,
    props.internalSection.sectionDurationInSeconds
  );
  const dockingCalc = calculateSectionDuration(
    props.dockingSection.audio.durationInSeconds || 0,
    props.dockingSection.sectionDurationInSeconds
  );
  const complianceCalc = calculateSectionDuration(
    props.complianceSection.audio.durationInSeconds || 0,
    props.complianceSection.sectionDurationInSeconds
  );
  
  const satDroneDuration = satDroneCalc.actualDuration * fps;
  const locationDuration = locationCalc.actualDuration * fps;
  const internalDuration = internalCalc.actualDuration * fps;
  const dockingDuration = dockingCalc.actualDuration * fps;
  const complianceDuration = complianceCalc.actualDuration * fps;
  const outroDuration = 5 * fps;

  const satDroneStart = introDuration;
  const locationStart = satDroneStart + satDroneDuration;
  const internalStart = locationStart + locationDuration;
  const dockingStart = internalStart + internalDuration;
  const complianceStart = dockingStart + dockingDuration;
  const outroStart = complianceStart + complianceDuration;
  
  // Calculate total duration (should end after outro)
  const totalDuration = outroStart + outroDuration;
  
  console.log("Total video duration:", totalDuration, "frames (", totalDuration / fps, "seconds)");

  return (
    <>
      {/* First Video Intro*/}
      <Sequence from={0} durationInFrames={introDuration}>
        <Intro clientname={props.intro.clientName} region={props.intro.projectLocationName} />
      </Sequence>

      {/* Second Video SatDrone */}
      <Sequence from={satDroneStart} durationInFrames={satDroneDuration}>
        <SatDrone
          dronevideourl={props.satDroneSection.droneVideoUrl || "Test"}
          satimageurl={props.satDroneSection.satelliteImageUrl}
          latitude={props.satDroneSection.location.lat}
          longitude={props.satDroneSection.location.lng}
          audio={props.satDroneSection.audio}
          startPaddingInSeconds={satDroneCalc.startPadding}
        />
      </Sequence>

      {/* Third Video Location*/}
      <Sequence from={locationStart} durationInFrames={locationDuration}>
        <LocationVid 
          {...props.locationSection}
          satelliteImageUrl={props.satDroneSection.satelliteImageUrl}
          startPaddingInSeconds={locationCalc.startPadding}
        />
      </Sequence>

      {/* Fourth Video  Internal*/}
      <Sequence from={internalStart} durationInFrames={internalDuration}>
        <InternalVid 
          {...props.internalSection}
          startPaddingInSeconds={internalCalc.startPadding}
        />
      </Sequence>

      {/* Fifth Video Docking & parking*/}
      <Sequence from={dockingStart} durationInFrames={dockingDuration}>
        <DockingParkingVid 
          {...props.dockingSection}
          startPaddingInSeconds={dockingCalc.startPadding}
        />
      </Sequence>

      {/* Sixth Video Compliances */}
      <Sequence from={complianceStart} durationInFrames={complianceDuration}>
        <CompliancesVid 
          {...props.complianceSection}
          startPaddingInSeconds={complianceCalc.startPadding}
        />
      </Sequence>

      {/*  Seventh Video (Outro) */}
      <Sequence from={outroStart} durationInFrames={outroDuration}>
        <Outro />
      </Sequence>
    </>
  );
};
