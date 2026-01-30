import { AbsoluteFill, Sequence } from "remotion";
import { Intro } from "./videoSections/Intro";
import { Outro } from "./videoSections/Outro";

export const Main = () => {
  const fps = 30;

  return (
    <>
      {/* First Video */}
      <Sequence from={0} durationInFrames={5 * fps}>
        <Intro />
      </Sequence>

      {/* Second Video */}

      <Sequence from={5 * fps} durationInFrames={5 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
            backgroundColor: "white",
          }}
        >
          5-10 sec: Map zoom in: has to be automated using satellite map data{" "}
          <br />
          cinematic drone sweep of the warehouse compound: Optional shot to be
          uploaded (Manual video 1a)
        </AbsoluteFill>
      </Sequence>

      {/* Third Video */}

      <Sequence from={10 * fps} durationInFrames={10 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
            backgroundColor: "white",
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
      </Sequence>

      {/* Fourth Video */}

      <Sequence from={20 * fps} durationInFrames={15 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
            backgroundColor: "white",
          }}
        >
          20-35 sec: Internal storage related photos and videos - Manual video
          2: Snippet showing entire length of the warehouse alongwith floor and
          ceiling. This is to be used to showcase annotations of features like
          clear height, ventilation, insulation, flooring etc and any animations
          of vertical racking. - Manual video 3: Internal access to docks and
          the arrangement of these docks inside. - manual video 4: Utility rooms
          and features ke videos (bathrooms, fire pump room, security room,
          canteen etc). Needs checkboxes for each feature uploaded.
        </AbsoluteFill>
      </Sequence>

      {/* Fourth Video */}

      <Sequence from={35 * fps} durationInFrames={10 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
            backgroundColor: "white",
          }}
        >
          35-45 sec: External docking and parking videos - Manual video 5: Dock
          access and docking space pan video
        </AbsoluteFill>
      </Sequence>

      {/* Fourth Video */}

      <Sequence from={45 * fps} durationInFrames={10 * fps}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
            backgroundColor: "white",
          }}
        >
          45-55 sec: Compliances: - Fire safety measures videos (hydrants,
          sprinklers, alarm system, pump room etc)
        </AbsoluteFill>
      </Sequence>

      <Sequence from={55 * fps} durationInFrames={5 * fps}>
        <Outro />
      </Sequence>
    </>
  );
};
