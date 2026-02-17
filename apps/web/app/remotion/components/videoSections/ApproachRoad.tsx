import { ApproachRoadSchema } from "@repo/shared";
import { z } from "zod";
import { VideoDisplay } from "../VideoDisplay";
import { ImageDisplay } from "../ImageDisplay";

export const ApproachRoad: React.FC<z.infer<typeof ApproachRoadSchema> & { startPaddingInSeconds?: number }> = (props) => {
  const hasVideo = props.videoUrl && props.videoUrl.trim().length > 0;
  const hasImage = props.imageUrl && props.imageUrl.trim().length > 0;

  if (hasVideo) {
    return (
      <VideoDisplay
        videoUrl={props.videoUrl}
        audioUrl={props.audio.audioUrl}
        transcript={props.audio.transcript}
        placeholderText="Approach Road - No Media"
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
        placeholderText="Approach Road - No Media"
        startPaddingInSeconds={props.startPaddingInSeconds}
      />
    );
  }

  return (
    <VideoDisplay
      audioUrl={props.audio.audioUrl}
      transcript={props.audio.transcript}
      placeholderText="Approach Road - No Media"
      startPaddingInSeconds={props.startPaddingInSeconds}
    />
  );
};
