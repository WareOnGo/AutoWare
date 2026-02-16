import { LocationHighlightSchema } from "@repo/shared";
import { z } from "zod";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Audio, Video } from "remotion";

export const LocationVid: React.FC<z.infer<typeof LocationHighlightSchema> & { startPaddingInSeconds?: number; satelliteImageUrl?: string }> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // If approach road video exists, show satellite for audio duration, then video for its specified duration
  const approachVideoDuration = props.approachRoadVideoDurationInSeconds || 0;
  const satelliteDuration = props.satelliteImageUrl && props.approachRoadVideoUrl 
    ? (props.audio.durationInSeconds || 0) * fps
    : durationInFrames;
  
  const transitionDuration = 0.5 * fps; // 0.5 second transition

  // Satellite image opacity: full initially, then fade out if video exists
  const satelliteOpacity = props.approachRoadVideoUrl && satelliteDuration > 0 ? interpolate(
    frame,
    [0, satelliteDuration - transitionDuration, satelliteDuration],
    [1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  ) : 1;

  // Approach road video opacity: fade in after satellite
  const videoOpacity = props.approachRoadVideoUrl && satelliteDuration > 0 ? interpolate(
    frame,
    [satelliteDuration - transitionDuration, satelliteDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  ) : 1;

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        {/* Satellite Image Layer - shows first (static, zoomed out from previous section) */}
        {props.satelliteImageUrl && (
          <AbsoluteFill
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: satelliteOpacity,
            }}
          >
            <img
              src={props.satelliteImageUrl}
              alt="Location satellite view"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </AbsoluteFill>
        )}

        {/* Approach Road Video Layer - shows after satellite (if provided) */}
        {props.approachRoadVideoUrl ? (
          <AbsoluteFill
            style={{
              opacity: videoOpacity,
            }}
          >
            <Video
              src={props.approachRoadVideoUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              startFrom={0}
            />
          </AbsoluteFill>
        ) : !props.satelliteImageUrl && (
          <AbsoluteFill
            style={{
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#1a1a1a",
            }}
          >
            <h2 style={{ color: "white", fontFamily: "Inter, sans-serif" }}>
              Location Section - No Media Added
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
                fontFamily: "Inter, sans-serif",
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
    </>
  );
};
