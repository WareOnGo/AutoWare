import { Sequence } from "remotion";
import { Intro } from "./videoSections/Intro";
import { Outro } from "./videoSections/Outro";
import { SatDrone } from "./videoSections/SatDrone";
import { LocationVid } from "./videoSections/Location";
import { InternalVid } from "./videoSections/InternalVid";
import { DockingParkingVid } from "./videoSections/DockingParkingVid";
import { CompliancesVid } from "./videoSections/CompliancesVid";

export const Main = () => {
  const fps = 30;

  return (
    <>
      {/* First Video Intro*/}
      <Sequence from={0} durationInFrames={5 * fps}>
        <Intro clientname="Client A" region="Nelamangala" state="Karnataka"  />
      </Sequence>

      {/* Second Video SatDrone */}

      <Sequence from={5 * fps} durationInFrames={5 * fps}>
          <SatDrone dronevideourl="Test" satimageurl="Test" latitude={12.9716} longitude={77.5946} />
      </Sequence>

      {/* Third Video Location*/}

      <Sequence from={10 * fps} durationInFrames={10 * fps}>
        <LocationVid/>
      </Sequence>

      {/* Fourth Video  Internal*/}

      <Sequence from={20 * fps} durationInFrames={15 * fps}>
        <InternalVid/>
      </Sequence>

      {/* Fifth Video Docking & parking*/}

      <Sequence from={35 * fps} durationInFrames={10 * fps}>
        <DockingParkingVid/>
      </Sequence>

      {/* Sixth Video Compliances */}

      <Sequence from={45 * fps} durationInFrames={10 * fps}>
        <CompliancesVid complianceList={["Fire safety measures videos (hydrants, sprinklers, alarm system, pump room etc)"]} />
      </Sequence>

      {/*  Seventh Video (Outro) */}
      <Sequence from={55 * fps} durationInFrames={5 * fps}>
        <Outro />
      </Sequence>
    </>
  );
};
