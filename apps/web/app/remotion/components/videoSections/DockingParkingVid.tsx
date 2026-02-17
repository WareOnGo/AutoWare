import { ExternalDockingSchema } from "@repo/shared";
import { z } from "zod";
import { VideoDisplay } from "../VideoDisplay";
import { ImageDisplay } from "../ImageDisplay";

export const DockingParkingVid: React.FC<z.infer<typeof ExternalDockingSchema> & { startPaddingInSeconds?: number }> = (props) => {
  const hasVideo = props.dockPanVideoUrl && props.dockPanVideoUrl.trim().length > 0;
  const hasImage = props.imageUrl && props.imageUrl.trim().length > 0;

  if (hasVideo) {
    return (
      <VideoDisplay
        videoUrl={props.dockPanVideoUrl}
        audioUrl={props.audio.audioUrl}
        transcript={props.audio.transcript}
        placeholderText="Docking Section - No Media"
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
        placeholderText="Docking Section - No Media"
        startPaddingInSeconds={props.startPaddingInSeconds}
      />
    );
  }

  return (
    <VideoDisplay
      audioUrl={props.audio.audioUrl}
      transcript={props.audio.transcript}
      placeholderText="Docking Section - No Media"
      startPaddingInSeconds={props.startPaddingInSeconds}
    />
  );
};
