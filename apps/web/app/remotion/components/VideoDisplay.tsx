import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo } from "remotion";

interface VideoDisplayProps {
    videoUrl?: string;
    audioUrl?: string;
    transcript?: string;
    placeholderText?: string;
    durationInFrames?: number; // Optional, might be useful if we want to force specific duration logic
    startPaddingInSeconds?: number; // Padding before audio starts
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({
    videoUrl,
    audioUrl,
    transcript,
    placeholderText = "Video not added",
    startPaddingInSeconds = 0,
}) => {
    return (
        <AbsoluteFill style={{ backgroundColor: "black" }}>
            {/* 1. Video Layer */}
            {videoUrl ? (
                <OffthreadVideo
                    src={videoUrl}
                    volume={0}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                    onError={(e) => {
                        console.error('Video failed to load:', videoUrl, e);
                    }}
                />
            ) : (
                <AbsoluteFill
                    style={{
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#1a1a1a",
                    }}
                >
                    <h2 style={{ color: "white", fontFamily: "Verdana, sans-serif" }}>
                        {placeholderText}
                    </h2>
                </AbsoluteFill>
            )}

            {/* 2. Audio Layer */}
            {audioUrl && (
                <Audio
                    src={audioUrl}
                />
            )}

            {/* 3. Subtitle Layer */}
            {transcript && (
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
                        {transcript}
                    </p>
                </AbsoluteFill>
            )}
        </AbsoluteFill>
    );
};
