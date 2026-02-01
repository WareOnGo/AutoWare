import { IntroModel } from "~/remotion/models/intro";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  interpolate
} from "remotion";



export const Intro: React.FC<IntroModel> = ({ clientname, region, state }) => {
    const frame = useCurrentFrame();
    
    const opacityClient = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp' });
    const opacityRegion = interpolate(frame, [30, 60], [0, 1], {extrapolateRight: 'clamp' });

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
        <img
          src={staticFile("WOG_logo.png")}
          width="300"
          style={{ marginBottom: 20 }}
        />
        <h1 style={{ fontSize: 50, fontWeight: 600, opacity: opacityClient }}>{clientname}</h1>
        <h2 style={{ opacity: opacityRegion }}>
          {region}, {state}
        </h2>
      </AbsoluteFill>
    </>
  );
};
