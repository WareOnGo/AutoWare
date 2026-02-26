import { CadFileSchema } from "@repo/shared";
import { z } from "zod";
import { useCurrentFrame, useVideoConfig, Img, Audio, AbsoluteFill, interpolate, Sequence } from "remotion";
import { ImageDisplay } from "../ImageDisplay";
import type { AnnotationLayer } from "@repo/shared";

const LayerOverlay: React.FC<{ layer: AnnotationLayer; durationFrames: number; fadeFrames: number }> = ({ layer, durationFrames, fadeFrames }) => {
    const frame = useCurrentFrame();

    let inputRange: number[];
    let outputRange: number[];

    if (durationFrames <= 2 * fadeFrames) {
        inputRange = [0, durationFrames / 2, durationFrames];
        outputRange = [0, 1, 0];
    } else {
        inputRange = [
            0,
            fadeFrames,
            durationFrames - fadeFrames,
            durationFrames
        ];
        outputRange = [0, 1, 1, 0];
    }

    const opacity = interpolate(
        frame,
        inputRange,
        outputRange,
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        }
    );

    return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
            {/* Drawing overlay with fade */}
            <div style={{ opacity, width: "100%", height: "100%" }}>
                {layer.drawingDataUrl ? (
                    <Img
                        src={layer.drawingDataUrl}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                ) : null}
            </div>

            {/* Per-layer audio — plays immediately relative to the sequence start */}
            {layer.audio.audioUrl && (
                <Audio src={layer.audio.audioUrl} volume={1} />
            )}

            {/* Per-layer subtitle */}
            {layer.audio.transcript && opacity > 0 && (
                <AbsoluteFill
                    style={{
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingBottom: 50,
                        opacity,
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
                        {layer.audio.transcript}
                    </p>
                </AbsoluteFill>
            )}
        </AbsoluteFill>
    );
};

export const CadFile: React.FC<z.infer<typeof CadFileSchema> & { startPaddingInSeconds?: number }> = (props) => {
    const hasImage = props.imageUrl && props.imageUrl.trim().length > 0;
    const { fps } = useVideoConfig();
    const annotations = props.annotations || [];

    const startPaddingFrames = (props.startPaddingInSeconds || 0) * fps;
    const fadeFrames = Math.round(0.5 * fps); // 0.5 seconds fade

    // Calculate start and end frames for each layer with continuous 0.5s crossfade overlaps
    let currentStartFrame = 0; // Starts at 0, first 0.5s fade-in overlaps global video transition
    const layersWithTiming = annotations.map((layer) => {
        // duration = audio + 1.0s (0.5s fade in before audio, 0.5s fade out after)
        const durationFrames = Math.round((layer.audio.durationInSeconds + 1.0) * fps);
        const start = currentStartFrame;
        const end = currentStartFrame + durationFrames;

        // Next layer crossfades over the current layer's fade-out (0.5s)
        currentStartFrame = end - fadeFrames;

        return { ...layer, startFrame: start, endFrame: end };
    });

    return (
        <div style={{ flex: 1, position: "relative" }}>
            {/* Base CAD image (no section-level audio) */}
            <ImageDisplay
                imageUrl={hasImage ? props.imageUrl : undefined}
                placeholderText="CAD File / Architecture Diagram - No Image"
                startPaddingInSeconds={props.startPaddingInSeconds}
            />

            {/* Annotation overlay layers with per-layer audio + subtitles */}
            {layersWithTiming.map((layer) => {
                const durationFrames = layer.endFrame - layer.startFrame;
                if (durationFrames <= 0) return null;

                return (
                    <Sequence
                        key={layer.id}
                        from={layer.startFrame}
                        durationInFrames={durationFrames}
                        name={`layer-${layer.id}`}
                    >
                        <LayerOverlay
                            layer={layer as unknown as AnnotationLayer}
                            durationFrames={durationFrames}
                            fadeFrames={fadeFrames}
                        />
                    </Sequence>
                );
            })}
        </div>
    );
};
