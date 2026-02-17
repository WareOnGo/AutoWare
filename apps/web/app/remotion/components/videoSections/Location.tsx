import { LocationHighlightSchema } from "@repo/shared";
import { z } from "zod";
import { AbsoluteFill, Audio } from "remotion";

export const LocationVid: React.FC<z.infer<typeof LocationHighlightSchema> & { startPaddingInSeconds?: number; satelliteImageUrl?: string }> = (props) => {
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        {/* Satellite Image Layer */}
        {props.satelliteImageUrl ? (
          <AbsoluteFill
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
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
        ) : (
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
