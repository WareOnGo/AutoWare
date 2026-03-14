import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";

export const Outro = () => {
  const frame = useCurrentFrame();

  // Faster fade in animation - fully visible by frame 30 (1 second at 30fps)
  const fadeInOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Faster glint animation - starts earlier and runs for 0.8 seconds
  const glintStart = 20;
  const glintDuration = 24; // 0.8 seconds at 30fps
  const glintProgress = interpolate(frame, [glintStart, glintStart + glintDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glint position - moves diagonally across the larger logo
  const glintX = interpolate(glintProgress, [0, 1], [-400, 700]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          position: "relative",
          opacity: fadeInOpacity,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("WOG_logo.png")}
          alt="WareOnGo Logo"
          width="600"
          style={{
            objectFit: "contain",
          }}
        />

        {/* Realistic metallic glint effect with multiple layers */}
        {frame >= glintStart && frame <= glintStart + glintDuration && (
          <>
            {/* Main glint */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: glintX,
                width: "100px",
                height: "100%",
                background: "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 70%, transparent 100%)",
                transform: "skewX(-30deg)",
                filter: "blur(16px)",
                pointerEvents: "none",
              }}
            />
            {/* Secondary softer glint */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: glintX - 20,
                width: "120px",
                height: "100%",
                background: "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 60%, transparent 100%)",
                transform: "skewX(-15deg)",
                filter: "blur(20px)",
                pointerEvents: "none",
              }}
            />
            {/* Sharp highlight core */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: glintX + 10,
                width: "20px",
                height: "100%",
                background: "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                transform: "skewX(-15deg)",
                filter: "blur(6px)",
                pointerEvents: "none",
              }}
            />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
