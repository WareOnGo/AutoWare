import { VideoDisplay } from "../VideoDisplay";
import { ImageDisplay } from "../ImageDisplay";

export const InternalUtilities: React.FC<any> = (props) => {
  const hasVideo = props.videoUrl && props.videoUrl.trim().length > 0;
  const hasImage = props.imageUrl && props.imageUrl.trim().length > 0;

  if (hasVideo) {
    return (
      <VideoDisplay
        videoUrl={props.videoUrl}
        audioUrl={props.audio.audioUrl}
        transcript={props.audio.transcript}
        placeholderText="Internal Utilities - No Media"
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
        placeholderText="Internal Utilities - No Media"
        startPaddingInSeconds={props.startPaddingInSeconds}
      />
    );
  }

  return (
    <VideoDisplay
      audioUrl={props.audio.audioUrl}
      transcript={props.audio.transcript}
      placeholderText="Internal Utilities - No Media"
      startPaddingInSeconds={props.startPaddingInSeconds}
    />
  );
};
