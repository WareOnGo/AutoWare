import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Audio } from "remotion";
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

  // Interpolate zoom from 2x to 1x (zoom out effect) over the duration of the section
  const scale = interpolate(
    frame,
    [0, durationInFrames],
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
        {/* Satellite Image with Zoom Animation */}
        <AbsoluteFill
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
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

        {/* Optional: Drone video overlay if provided */}
        {dronevideourl && (
          <AbsoluteFill
            style={{
              opacity: interpolate(
                frame,
                [durationInFrames * 0.7, durationInFrames],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }
              ),
            }}
          >
            {/* Drone video would go here */}
          </AbsoluteFill>
        )}

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
