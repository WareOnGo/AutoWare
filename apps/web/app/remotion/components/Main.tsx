import { Sequence } from "remotion";
import { Intro } from "./videoSections/Intro";
import { Outro } from "./videoSections/Outro";
import { SatDrone } from "./videoSections/SatDrone";
import { LocationVid } from "./videoSections/Location";
import { InternalVid } from "./videoSections/InternalVid";
import { DockingParkingVid } from "./videoSections/DockingParkingVid";
import { CompliancesVid } from "./videoSections/CompliancesVid";

import { WarehouseVideoProps } from "@repo/shared";

export const Main: React.FC<WarehouseVideoProps> = (props) => {
  const fps = 30;

  // Debug: Check if props are being passed
  console.log("Main component props:", props);
  console.log("Props meta:", props?.meta);

  // Fallback if props are undefined
  if (!props || !props.meta) {
    return (
      <div style={{ color: 'red', padding: 20 }}>
        ERROR: Props not passed correctly. Props: {JSON.stringify(props)}
      </div>
    );
  }

  return (
    <>
      {/* First Video Intro*/}
      <Sequence from={0} durationInFrames={5 * fps}>
        {/* OLD: <Intro clientname="Client B" region="ABXD" state="Karnataka"  /> */}
        {/* TODO: Update Intro to use props.meta.clientName and props.meta.projectLocationName */}
        <Intro clientname={props.meta.clientName} region={props.meta.projectLocationName} />
      </Sequence>

      {/* Second Video SatDrone */}
      <Sequence from={5 * fps} durationInFrames={5 * fps}>
        {/* OLD: <SatDrone dronevideourl="Test" satimageurl="Test" latitude={12.9716} longitude={77.5946} /> */}
        {/* TODO: Update SatDrone to use props.sectionSatDrone */}
        <SatDrone
          dronevideourl={props.sectionSatDrone.droneVideoUrl || "Test"}
          satimageurl="Test"
          latitude={props.sectionSatDrone.location.lat}
          longitude={props.sectionSatDrone.location.lng}
        />
      </Sequence>

      {/* Third Video Location*/}
      <Sequence from={10 * fps} durationInFrames={10 * fps}>
        {/* OLD: <LocationVid/> */}
        {/* TODO: Update LocationVid to use props.sectionLocation */}
        <LocationVid />
      </Sequence>

      {/* Fourth Video  Internal*/}
      <Sequence from={20 * fps} durationInFrames={15 * fps}>
        {/* OLD: <InternalVid/> */}
        {/* TODO: Update InternalVid to use props.sectionInternal */}
        <InternalVid />
      </Sequence>

      {/* Fifth Video Docking & parking*/}
      <Sequence from={35 * fps} durationInFrames={10 * fps}>
        {/* OLD: <DockingParkingVid/> */}
        {/* TODO: Update DockingParkingVid to use props.sectionDocking */}
        <DockingParkingVid />
      </Sequence>

      {/* Sixth Video Compliances */}
      <Sequence from={45 * fps} durationInFrames={10 * fps}>
        {/* OLD: <CompliancesVid complianceList={["Fire safety measures videos (hydrants, sprinklers, alarm system, pump room etc)"]} /> */}
        {/* TODO: Update CompliancesVid to use props.sectionCompliance */}
        <CompliancesVid complianceList={["Fire safety measures videos (hydrants, sprinklers, alarm system, pump room etc)"]} />
      </Sequence>

      {/*  Seventh Video (Outro) */}
      <Sequence from={55 * fps} durationInFrames={5 * fps}>
        <Outro />
      </Sequence>
    </>
  );
};
