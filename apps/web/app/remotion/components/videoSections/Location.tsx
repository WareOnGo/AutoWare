import { LocationHighlightSchema } from "@repo/shared";
import { z } from "zod";
import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

const LocationCard: React.FC<{ label: string; type: string; distance: number; index: number }> = ({ label, type, distance, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Icon mapping for different types
  const getIconPath = (type: string) => {
    switch (type) {
      case 'road': return '/icons/road.png';
      case 'airport': return '/icons/airport.png';
      case 'railway': return '/icons/railway.png';
      case 'port': return '/icons/port.png';
      case 'hospital': return '/icons/hospital.png';
      case 'bus': return '/icons/bus.png';
      default: return '/icons/other.png';
    }
  };

  // Stagger the animation for each card
  const delay = index * 0.1 * fps; // 0.1 second delay between each card
  const animationDuration = 0.5 * fps; // 0.5 second animation

  const translateY = interpolate(
    frame,
    [delay, delay + animationDuration],
    [-100, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const opacity = interpolate(
    frame,
    [delay, delay + animationDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '16px 20px',
        minWidth: '240px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
        transform: `translateY(${translateY}px)`,
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Img
          src={getIconPath(type)}
          style={{
            width: '32px',
            height: '32px',
            opacity: 0.4,
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '17px',
          color: '#000000',
          fontWeight: '600',
          marginBottom: '2px',
          lineHeight: '1.3',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '14px',
          color: 'rgba(0, 0, 0, 0.5)',
          fontWeight: '500',
        }}>
          {distance} km away
        </div>
      </div>
    </div>
  );
};

export const LocationVid: React.FC<z.infer<typeof LocationHighlightSchema> & { startPaddingInSeconds?: number; satelliteImageUrl?: string }> = (props) => {
  const nearbyPoints = props.nearbyPoints || [];

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
            <Img
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
            <h2 style={{ color: "white", fontFamily: "Verdana, sans-serif" }}>
              Location Section - No Media Added
            </h2>
          </AbsoluteFill>
        )}

        {/* Audio Layer */}
        {props.audio.audioUrl && (
          <Audio src={props.audio.audioUrl} />
        )}

        {/* Nearby Points Cards */}
        {nearbyPoints.length > 0 && (
          <AbsoluteFill
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: '60px',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '300px',
              }}
            >
              {nearbyPoints.map((point, index) => (
                <LocationCard
                  key={index}
                  label={point.name}
                  type={point.type}
                  distance={point.distanceKm}
                  index={index}
                />
              ))}
            </div>
          </AbsoluteFill>
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
    </>
  );
};
