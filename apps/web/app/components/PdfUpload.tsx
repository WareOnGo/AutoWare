import * as React from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "~/lib/utils";
import { PdfPageSelector } from "./PdfPageSelector";

interface PdfUploadProps {
    value?: string;
    onChange?: (url: string) => void;
    onFileSelect?: (file: File | null) => void;
    className?: string;
    label?: string;
}

export const PdfUpload: React.FC<PdfUploadProps> = ({
    value,
    onChange,
    onFileSelect,
    className,
    label = "Upload PDF",
}) => {
    const [preview, setPreview] = React.useState<string | null>(value || null);
    const [fileName, setFileName] = React.useState<string>("");
    const [showPageSelector, setShowPageSelector] = React.useState(false);
    const [pdfFile, setPdfFile] = React.useState<File | null>(null);
    const [pageCount, setPageCount] = React.useState<number>(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Generate unique ID for this upload instance
    const uploadId = React.useId();

    // Cleanup blob URLs on unmount
    React.useEffect(() => {
        return () => {
            if (preview && preview.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if it's an image file
        if (file.type.startsWith("image/")) {
            // Handle as regular image
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            setFileName(file.name);
            onChange?.(objectUrl);
            onFileSelect?.(file);
            return;
        }

        // Validate file type for PDF
        if (file.type !== "application/pdf") {
            alert("Please select a valid PDF or image file");
            return;
        }

        setFileName(file.name);
        setPdfFile(file);

        // Load PDF to check page count
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pageCount = await getPdfPageCount(arrayBuffer);
            setPageCount(pageCount);

            if (pageCount > 1) {
                // Show page selector modal
                setShowPageSelector(true);
            } else {
                // Single page - convert directly
                await convertPdfPageToPng(arrayBuffer, 1);
            }
        } catch (error) {
            console.error("Error processing PDF:", error);
            alert("Failed to process PDF file");
        }
    };

    const getPdfPageCount = async (arrayBuffer: ArrayBuffer): Promise<number> => {
        // Dynamically import pdfjs-dist
        const pdfjsLib = await import("pdfjs-dist");
        
        // Use local worker file to avoid CORS issues
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.mjs";

        // Clone the array buffer to prevent detachment
        const clonedBuffer = arrayBuffer.slice(0);
        
        const pdf = await pdfjsLib.getDocument({ 
            data: new Uint8Array(clonedBuffer)
        }).promise;
        return pdf.numPages;
    };

    const convertPdfPageToPng = async (arrayBuffer: ArrayBuffer, pageNumber: number) => {
        try {
            // Dynamically import pdfjs-dist
            const pdfjsLib = await import("pdfjs-dist");
            
            // Use local worker file to avoid CORS issues
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.mjs";

            // Clone the array buffer to prevent detachment
            const clonedBuffer = arrayBuffer.slice(0);
            
            const pdf = await pdfjsLib.getDocument({ 
                data: new Uint8Array(clonedBuffer)
            }).promise;
            const page = await pdf.getPage(pageNumber);

            // Get viewport with scale for good quality
            const viewport = page.getViewport({ scale: 2.0 });

            // Create canvas
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Could not get canvas context");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Render PDF page to canvas (using any to bypass type issues with pdfjs-dist)
            await (page.render as any)({
                canvasContext: context,
                viewport: viewport,
            }).promise;

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to convert canvas to blob"));
                }, "image/png");
            });

            // Create file from blob
            const pngFile = new File([blob], fileName.replace(".pdf", ".png"), {
                type: "image/png",
            });

            // Create object URL for preview
            const objectUrl = URL.createObjectURL(blob);
            setPreview(objectUrl);

            // Call onChange with the object URL
            onChange?.(objectUrl);

            // Call onFileSelect with the PNG file
            onFileSelect?.(pngFile);
        } catch (error) {
            console.error("Error converting PDF to PNG:", error);
            alert("Failed to convert PDF to PNG");
        }
    };

    const handlePageSelect = async (pageNumber: number) => {
        if (!pdfFile) return;

        const arrayBuffer = await pdfFile.arrayBuffer();
        await convertPdfPageToPng(arrayBuffer, pageNumber);
        setShowPageSelector(false);
    };

    const handleRemove = () => {
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setFileName("");
        setPdfFile(null);
        setPageCount(0);
        onChange?.("");
        onFileSelect?.(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <div className={cn("w-full", className)}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
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
                            <p className="text-xs text-gray-500">PDF or Image (JPG, PNG, WebP)</p>
                        </div>
                    </label>
                ) : (
                    <div className="relative w-full border border-gray-300 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 p-4 bg-gray-50">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {fileName || "PDF converted to PNG"}
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
                        {/* Image preview */}
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full max-h-48 object-contain bg-gray-100"
                        />
                    </div>
                )}
            </div>

            {/* Page selector modal */}
            {showPageSelector && pdfFile && (
                <PdfPageSelector
                    pdfFile={pdfFile}
                    pageCount={pageCount}
                    onSelectPage={handlePageSelect}
                    onClose={() => {
                        setShowPageSelector(false);
                        setPdfFile(null);
                        setFileName("");
                        if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                        }
                    }}
                />
            )}
        </>
    );
};
