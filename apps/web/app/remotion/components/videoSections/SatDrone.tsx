import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Audio, Video } from "remotion";
import { satdroneModel } from "~/remotion/models/satdrone";

export const SatDrone: React.FC<satdroneModel> = ({ 
  latitude, 
  longitude, 
  dronevideourl, 
  satimageurl,
  audio,
  startPaddingInSeconds = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // Use provided satellite image URL if available, otherwise fallback to Google Maps Static API
  const satelliteImageUrl = satimageurl || `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=17&size=1920x1080&maptype=satellite&key=YOUR_API_KEY`;

  // If drone video exists AND is not empty, show it for 3 seconds, then transition to satellite
  const hasDroneVideo = dronevideourl && dronevideourl.trim().length > 0 && dronevideourl !== "Test";
  const droneVideoDuration = hasDroneVideo ? 3 * fps : 0;
  const transitionDuration = 0.5 * fps; // 0.5 second transition

  // Drone video opacity: full for first 3 seconds, then fade out
  const droneOpacity = hasDroneVideo ? interpolate(
    frame,
    [0, droneVideoDuration - transitionDuration, droneVideoDuration],
    [1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  ) : 0;

  // Satellite image opacity: fade in after drone video, or always visible if no drone video
  const satelliteOpacity = hasDroneVideo ? interpolate(
    frame,
    [droneVideoDuration - transitionDuration, droneVideoDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  ) : 1; // Always visible if no drone video

  // Interpolate zoom from 2x to 1x (zoom out effect) over the duration of the section
  // Start zoom animation from the beginning if no drone video, otherwise after drone video ends
  const zoomStartFrame = hasDroneVideo ? droneVideoDuration : 0;
  const scale = interpolate(
    frame,
    [zoomStartFrame, durationInFrames],
    [2, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <>
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          overflow: "hidden",
        }}
      >
        {/* Drone Video Layer (if provided) - shows first */}
        {hasDroneVideo && dronevideourl && (
          <AbsoluteFill
            style={{
              opacity: droneOpacity,
            }}
          >
            <Video
              src={dronevideourl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              startFrom={0}
            />
          </AbsoluteFill>
        )}

        {/* Satellite Image with Zoom Animation - shows after drone video */}
        <AbsoluteFill
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: satelliteOpacity,
          }}
        >
          <img
            src={satelliteImageUrl}
            alt="Satellite view"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          />
        </AbsoluteFill>

        {/* Audio Layer */}
        {audio?.audioUrl && (
          <Audio 
            src={audio.audioUrl}
          />
        )}

        {/* Subtitle Layer */}
        {audio?.transcript && (
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
              {audio.transcript}
            </p>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </>
  );
};
