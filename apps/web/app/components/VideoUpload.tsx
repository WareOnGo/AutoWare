import * as React from "react";
import { Upload, X, Video } from "lucide-react";
import { cn } from "~/lib/utils";

interface VideoUploadProps {
    value?: string;
    onChange?: (url: string) => void;
    className?: string;
    label?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
    value,
    onChange,
    className,
    label = "Upload Video",
}) => {
    const [preview, setPreview] = React.useState<string | null>(value || null);
    const [fileName, setFileName] = React.useState<string>("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Generate unique ID for this upload instance
    const uploadId = React.useId();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("video/")) {
            alert("Please select a valid video file");
            return;
        }

        // Create object URL for preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setFileName(file.name);

        // Call onChange with the object URL
        onChange?.(objectUrl);
    };

    const handleRemove = () => {
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setFileName("");
        onChange?.("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // NOTE: Disabled blob URL cleanup - videos need to persist for Remotion player
    /*
        // Cleanup object URL on unmount
        return () => {
            if (preview && preview.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]); */

    return (
        <div className={cn("w-full", className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id={uploadId}
            />

            {!preview ? (
                <label
                    htmlFor={uploadId}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">{label}</span>
                        </p>
                        <p className="text-xs text-gray-500">MP4, WebM, or AVI</p>
                    </div>
                </label>
            ) : (
                <div className="relative w-full border border-gray-300 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-gray-50">
                        <Video className="w-5 h-5 text-gray-600" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {fileName || "Video uploaded"}
                            </p>
                            <p className="text-xs text-gray-500">Click to change</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                    {/* Optional: Show video preview */}
                    <video
                        src={preview}
                        className="w-full max-h-48 object-contain bg-black"
                        controls
                    />
                </div>
            )}
        </div>
    );
};
