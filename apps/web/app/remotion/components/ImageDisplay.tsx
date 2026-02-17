import React from "react";
import { AbsoluteFill, Img, Audio } from "remotion";

interface ImageDisplayProps {
    imageUrl?: string;
    audioUrl?: string;
    transcript?: string;
    placeholderText?: string;
    startPaddingInSeconds?: number;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
    imageUrl,
    audioUrl,
    transcript,
    placeholderText = "Image not added",
    startPaddingInSeconds = 0,
}) => {

    return (
        <AbsoluteFill style={{ backgroundColor: "black" }}>
            {/* 1. Image Layer */}
            {imageUrl ? (
                <Img
                    src={imageUrl}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
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
                    <h2 style={{ color: "white", fontFamily: "Inter, sans-serif" }}>
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
                            fontFamily: "Inter, sans-serif",
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
