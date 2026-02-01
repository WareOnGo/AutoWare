import { AbsoluteFill, useCurrentFrame } from "remotion";

export const LocationVid = () => {
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
          10-20 sec: Map highlight of key nearby locations: mix of automated
          with human nudge <br />
          Human highlights nearby key roads, hospital, railway/airport then
          highlighted using map data into a crisp animation (showing distance){" "}
          <br />
          Another optional manual video of the approach road entering to the
          warehouse (Manual video 1b)
      </AbsoluteFill>
    </>
  );
};
