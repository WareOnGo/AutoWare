import { CadFileSchema } from "@repo/shared";
import { z } from "zod";
import { ImageDisplay } from "../ImageDisplay";

export const CadFile: React.FC<z.infer<typeof CadFileSchema> & { startPaddingInSeconds?: number }> = (props) => {
    const hasImage = props.imageUrl && props.imageUrl.trim().length > 0;

    return (
        <ImageDisplay
            imageUrl={hasImage ? props.imageUrl : undefined}
            audioUrl={props.audio.audioUrl}
            transcript={props.audio.transcript}
            placeholderText="CAD File / Architecture Diagram - No Image"
            startPaddingInSeconds={props.startPaddingInSeconds}
        />
    );
};
