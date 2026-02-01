import { AbsoluteFill, useCurrentFrame } from "remotion";

export const InternalVid = () => {
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
          20-35 sec: Internal storage related photos and videos - Manual video
          2: Snippet showing entire length of the warehouse alongwith floor and
          ceiling. This is to be used to showcase annotations of features like
          clear height, ventilation, insulation, flooring etc and any animations
          of vertical racking. - Manual video 3: Internal access to docks and
          the arrangement of these docks inside. - manual video 4: Utility rooms
          and features ke videos (bathrooms, fire pump room, security room,
          canteen etc). Needs checkboxes for each feature uploaded.
      </AbsoluteFill>
    </>
  );
};
