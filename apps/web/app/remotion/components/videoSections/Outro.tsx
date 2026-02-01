import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Outro = () => {
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
        WareOnGo Outro <br />
        The current frame is {frame}.
      </AbsoluteFill>
    </>
  );
};
