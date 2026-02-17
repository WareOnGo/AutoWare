import { ComplianceSchema } from "@repo/shared";
import { z } from "zod";
import { VideoDisplay } from "../VideoDisplay";
import { ImageDisplay } from "../ImageDisplay";

export const CompliancesVid: React.FC<z.infer<typeof ComplianceSchema> & { startPaddingInSeconds?: number }> = (props) => {
  // Prefer video if available, otherwise use image
  const hasVideo = props.fireSafetyVideoUrl && props.fireSafetyVideoUrl.trim().length > 0;
  const hasImage = props.imageUrl && props.imageUrl.trim().length > 0;

  if (hasVideo) {
    return (
      <VideoDisplay
        videoUrl={props.fireSafetyVideoUrl}
        audioUrl={props.audio.audioUrl}
        transcript={props.audio.transcript}
        placeholderText="Compliance Section - No Media"
        startPaddingInSeconds={props.startPaddingInSeconds}
      />
    );
  }

  if (hasImage) {
    return (
      <ImageDisplay
        imageUrl={props.imageUrl}
        audioUrl={props.audio.audioUrl}
        transcript={props.audio.transcript}
        placeholderText="Compliance Section - No Media"
        startPaddingInSeconds={props.startPaddingInSeconds}
      />
    );
  }

  // Fallback to VideoDisplay with no media
  return (
    <VideoDisplay
      audioUrl={props.audio.audioUrl}
      transcript={props.audio.transcript}
      placeholderText="Compliance Section - No Media"
      startPaddingInSeconds={props.startPaddingInSeconds}
    />
  );
};
