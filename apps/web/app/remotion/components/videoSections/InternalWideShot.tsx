import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { VideoDisplay } from "../VideoDisplay";
import { ImageDisplay } from "../ImageDisplay";

const SpecCard: React.FC<{ label: string; value: string | boolean; index: number }> = ({ label, value, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;

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
        padding: '20px',
        minWidth: '200px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div style={{
        fontSize: '14px',
        color: 'rgba(0, 0, 0, 0.6)',
        marginBottom: '8px',
        fontWeight: '500',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '20px',
        color: '#000000',
        fontWeight: '600',
      }}>
        {displayValue}
      </div>
    </div>
  );
};

export const InternalWideShot: React.FC<any> = (props) => {
  const hasVideo = props.videoUrl && props.videoUrl.trim().length > 0;
  const hasImage = props.imageUrl && props.imageUrl.trim().length > 0;
  const specs = props.specs || {};

  const specsData = [
    { label: 'Clear Height', value: specs.clearHeight },
    { label: 'Number of Docks', value: specs.numberOfDocks },
    { label: 'Fire NOC Available', value: specs.fireNocAvailable },
  ].filter(item => item.value !== undefined && item.value !== null && item.value !== '');

  return (
    <AbsoluteFill>
      {hasVideo ? (
        <VideoDisplay
          videoUrl={props.videoUrl}
          audioUrl={props.audio.audioUrl}
          transcript={props.audio.transcript}
          placeholderText="Internal Wide Shot - No Media"
          startPaddingInSeconds={props.startPaddingInSeconds}
        />
      ) : hasImage ? (
        <ImageDisplay
          imageUrl={props.imageUrl}
          audioUrl={props.audio.audioUrl}
          transcript={props.audio.transcript}
          placeholderText="Internal Wide Shot - No Media"
          startPaddingInSeconds={props.startPaddingInSeconds}
        />
      ) : (
        <VideoDisplay
          audioUrl={props.audio.audioUrl}
          transcript={props.audio.transcript}
          placeholderText="Internal Wide Shot - No Media"
          startPaddingInSeconds={props.startPaddingInSeconds}
        />
      )}
      {specsData.length > 0 && (
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
            {specsData.map((spec, index) => (
              <SpecCard key={index} label={spec.label} value={spec.value} index={index} />
            ))}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
