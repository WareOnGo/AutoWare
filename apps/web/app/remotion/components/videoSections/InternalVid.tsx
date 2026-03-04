import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Audio, OffthreadVideo } from "remotion";

export const InternalVid: React.FC<any> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Build array of videos that actually exist with their durations
  const videos = [];
  
  if (props.wideShotVideoUrl && props.wideShotVideoDurationInSeconds && props.wideShotVideoDurationInSeconds > 0) {
    videos.push({
      url: props.wideShotVideoUrl,
      duration: props.wideShotVideoDurationInSeconds * fps,
    });
  }
  
  if (props.internalDockVideoUrl && props.internalDockVideoDurationInSeconds && props.internalDockVideoDurationInSeconds > 0) {
    videos.push({
      url: props.internalDockVideoUrl,
      duration: props.internalDockVideoDurationInSeconds * fps,
    });
  }
  
  if (props.utilities.videoUrl && props.utilities.videoDurationInSeconds && props.utilities.videoDurationInSeconds > 0) {
    videos.push({
      url: props.utilities.videoUrl,
      duration: props.utilities.videoDurationInSeconds * fps,
    });
  }

  const transitionDuration = 0.5 * fps; // 0.5 second transition

  // Calculate start times dynamically based on which videos exist
  let currentStart = 0;
  const videoTimings = videos.map((video) => {
    const start = currentStart;
    const end = start + video.duration;
    currentStart = end;
    return { ...video, start, end };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Render each video that exists */}
      {videoTimings.map((video, index) => {
        const isFirst = index === 0;
        const isLast = index === videoTimings.length - 1;
        
        let opacity;
        if (isFirst && isLast) {
          // Only video - stay visible throughout
          opacity = 1;
        } else if (isFirst) {
          // First video - fade out at end
          opacity = interpolate(
            frame,
            [video.start, video.end - transitionDuration, video.end],
            [1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
        } else if (isLast) {
          // Last video - fade in at start and stay visible
          opacity = interpolate(
            frame,
            [video.start - transitionDuration, video.start],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
        } else {
          // Middle video - fade in and out
          opacity = interpolate(
            frame,
            [
              video.start - transitionDuration,
              video.start,
              video.end - transitionDuration,
              video.end
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
        }

        // Only render video when it should be visible (opacity > 0)
        const shouldRender = isFirst && isLast ? true : 
          (isFirst ? frame < video.end : 
            (isLast ? frame >= video.start - transitionDuration : 
              frame >= video.start - transitionDuration && frame < video.end));

        if (!shouldRender) return null;

        return (
          <AbsoluteFill key={video.url} style={{ opacity, backgroundColor: "black" }}>
            <OffthreadVideo
              src={video.url}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              startFrom={0}
            />
          </AbsoluteFill>
        );
      })}

      {/* Placeholder if no videos */}
      {videos.length === 0 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#1a1a1a",
          }}
        >
          <h2 style={{ color: "white", fontFamily: "Verdana, sans-serif" }}>
            Internal Section - No Videos Uploaded
          </h2>
        </AbsoluteFill>
      )}

      {/* Audio Layer */}
      {props.audio.audioUrl && (
        <Audio src={props.audio.audioUrl} />
      )}

      {/* Subtitle Layer */}
      {props.audio.transcript && (
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: 50,
          }}
        >
          <p
            style={{
              color: "white",
              fontSize: 32,
              fontFamily: "Verdana, sans-serif",
              textAlign: "center",
              fontWeight: "bold",
              margin: 0,
              textShadow: "2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9), 1px -1px 2px rgba(0,0,0,0.9), -1px 1px 2px rgba(0,0,0,0.9)",
              maxWidth: "80%",
            }}
          >
            {props.audio.transcript}
          </p>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
