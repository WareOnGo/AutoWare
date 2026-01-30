import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Intro = () => {
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
        WareOnGo Intro <br />
        The current frame is {frame}.
      </AbsoluteFill>
    </>
  );
};
