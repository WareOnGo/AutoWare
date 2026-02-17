import * as React from "react";
import { Upload, X, Video, Image as ImageIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface MediaUploadProps {
    videoValue?: string;
    imageValue?: string;
    onVideoChange?: (url: string) => void;
    onImageChange?: (url: string) => void;
    onFileSelect?: (file: File | null, type: 'video' | 'image') => void;
    className?: string;
    label?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
    videoValue,
    imageValue,
    onVideoChange,
    onImageChange,
    onFileSelect,
    className,
    label = "Upload Media",
}) => {
    const [mediaType, setMediaType] = React.useState<'video' | 'image' | null>(
        videoValue ? 'video' : imageValue ? 'image' : null
    );
    const [preview, setPreview] = React.useState<string | null>(
        videoValue || imageValue || null
    );
    const [fileName, setFileName] = React.useState<string>("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Generate unique ID for this upload instance
    const uploadId = React.useId();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Determine file type
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isVideo && !isImage) {
            alert("Please select a valid video or image file");
            return;
        }

        const type = isVideo ? 'video' : 'image';

        // Create object URL for preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setFileName(file.name);
        setMediaType(type);

        // Call appropriate onChange handler
        if (type === 'video') {
            onVideoChange?.(objectUrl);
            onImageChange?.(""); // Clear image
        } else {
            onImageChange?.(objectUrl);
            onVideoChange?.(""); // Clear video
        }
        
        // Call onFileSelect with the actual file for pending uploads
        onFileSelect?.(file, type);
    };

    const handleRemove = () => {
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setFileName("");
        setMediaType(null);
        onVideoChange?.("");
        onImageChange?.("");
        onFileSelect?.(null, 'video');
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getMediaIcon = () => {
        if (mediaType === 'video') return <Video className="w-5 h-5 text-gray-600" />;
        if (mediaType === 'image') return <ImageIcon className="w-5 h-5 text-gray-600" />;
        return <Upload className="w-8 h-8 mb-2 text-gray-500" />;
    };

    const getMediaTypeLabel = () => {
        if (mediaType === 'video') return 'Video';
        if (mediaType === 'image') return 'Image';
        return 'Media';
    };

    return (
        <div className={cn("w-full", className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
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
                        {getMediaIcon()}
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">{label}</span>
                        </p>
                        <p className="text-xs text-gray-500">Video (MP4, WebM) or Image (JPG, PNG, WebP)</p>
                    </div>
                </label>
            ) : (
                <div className="relative w-full border border-gray-300 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-4 bg-gray-50">
                        {getMediaIcon()}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {fileName || `${getMediaTypeLabel()} uploaded`}
                            </p>
                            <p className="text-xs text-gray-500">
                                {mediaType === 'video' ? 'Video' : 'Image'} • Click to change
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                    {/* Preview */}
                    {mediaType === 'video' ? (
                        <video
                            src={preview}
                            className="w-full max-h-48 object-contain bg-black"
                            controls
                        />
                    ) : (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full max-h-48 object-contain bg-gray-100"
                        />
                    )}
                </div>
            )}
        </div>
    );
};
