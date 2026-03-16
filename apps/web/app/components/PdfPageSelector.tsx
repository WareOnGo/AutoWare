import * as React from "react";
import { X } from "lucide-react";

interface PdfPageSelectorProps {
    pdfFile: File;
    pageCount: number;
    onSelectPage: (pageNumber: number) => void;
    onClose: () => void;
}

export const PdfPageSelector: React.FC<PdfPageSelectorProps> = ({
    pdfFile,
    pageCount,
    onSelectPage,
    onClose,
}) => {
    const [pagePreviews, setPagePreviews] = React.useState<string[]>([]);
    const [selectedPage, setSelectedPage] = React.useState<number>(1);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        generatePagePreviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfFile]);

    // Cleanup data URLs on unmount
    React.useEffect(() => {
        return () => {
            // Data URLs don't need cleanup, but we clear the state
            setPagePreviews([]);
        };
    }, []);

    const generatePagePreviews = async () => {
        try {
            setIsLoading(true);
            const arrayBuffer = await pdfFile.arrayBuffer();
            
            // Dynamically import pdfjs-dist
            const pdfjsLib = await import("pdfjs-dist");
            
            // Use local worker file to avoid CORS issues
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.mjs";

            // Clone the array buffer to prevent detachment
            const clonedBuffer = arrayBuffer.slice(0);
            
            const pdf = await pdfjsLib.getDocument({ 
                data: new Uint8Array(clonedBuffer)
            }).promise;
            const previews: string[] = [];

            // Generate preview for each page
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 }); // Smaller scale for thumbnails

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (!context) continue;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Render PDF page to canvas (using any to bypass type issues with pdfjs-dist)
                await (page.render as any)({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;

                const dataUrl = canvas.toDataURL("image/png");
                previews.push(dataUrl);
            }

            setPagePreviews(previews);
        } catch (error) {
            console.error("Error generating page previews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        onSelectPage(selectedPage);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Select Page
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Only 1 page is allowed for this section. Please select which page to use.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-4 text-sm text-gray-500">Loading pages...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {pagePreviews.map((preview, index) => {
                                const pageNumber = index + 1;
                                const isSelected = selectedPage === pageNumber;

                                return (
                                    <button
                                        key={pageNumber}
                                        type="button"
                                        onClick={() => setSelectedPage(pageNumber)}
                                        className={cn(
                                            "relative border-2 rounded-lg overflow-hidden transition-all hover:shadow-lg",
                                            isSelected
                                                ? "border-blue-600 ring-2 ring-blue-200"
                                                : "border-gray-300 hover:border-gray-400"
                                        )}
                                    >
                                        <img
                                            src={preview}
                                            alt={`Page ${pageNumber}`}
                                            className="w-full h-auto"
                                        />
                                        <div
                                            className={cn(
                                                "absolute bottom-0 left-0 right-0 py-2 text-center text-sm font-medium",
                                                isSelected
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-100 text-gray-700"
                                            )}
                                        >
                                            Page {pageNumber}
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                                ✓
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                    <p className="text-sm text-gray-600">
                        Selected: Page {selectedPage} of {pageCount}
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function (same as in other components)
function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}
