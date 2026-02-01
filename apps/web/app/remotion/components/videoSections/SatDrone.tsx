import { AbsoluteFill, useCurrentFrame } from "remotion";
import { satdroneModel } from "~/remotion/models/satdrone";

export const SatDrone : React.FC<satdroneModel> = () => {
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
          5-10 sec: Map zoom in: has to be automated using satellite map data
          <br />
          cinematic drone sweep of the warehouse compound: Optional shot to be
          uploaded (Manual video 1a)
      </AbsoluteFill>
    </>
  );
};
