import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CompliancesModel } from "~/remotion/models/Compliances";

export const CompliancesVid: React.FC<CompliancesModel> = ({ complianceList }) => {
  const frame = useCurrentFrame();
  console.log(complianceList);

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
          45-55 sec: Compliances: - Fire safety measures videos (hydrants,
          sprinklers, alarm system, pump room etc)
      </AbsoluteFill>
    </>
  );
};
