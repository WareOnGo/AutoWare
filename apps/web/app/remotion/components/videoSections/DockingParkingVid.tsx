import { AbsoluteFill, useCurrentFrame } from "remotion";

export const DockingParkingVid = () => {
  const frame = useCurrentFrame();

  return (
    <>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontSize: 40,
          backgroundColor: "white",
          textAlign: "center",
        }}
      >
          35-45 sec: External docking and parking videos - Manual video 5: Dock
          access and docking space pan video
      </AbsoluteFill>
    </>
  );
};
