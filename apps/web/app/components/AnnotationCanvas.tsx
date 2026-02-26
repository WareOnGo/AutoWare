import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Undo2, Redo2, Plus } from "lucide-react";
import type { AnnotationLayer } from "@repo/shared";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tool = "pen" | "rect";
type RectDef = { x: number; y: number; w: number; h: number; color: string };

interface UndoState {
    canvasData: ImageData;
    rects: RectDef[];
}

interface AnnotationCanvasProps {
    imageUrl: string;
    existingLayers: AnnotationLayer[];
    onSave: (layers: AnnotationLayer[]) => void;
    onClose: () => void;
}

const MAX_HISTORY = 20;
const RECT_OPACITY = 0.2;
const PEN_OPACITY = 0.5;

// ─── Preset colours ──────────────────────────────────────────────────────────
const PRESET_COLORS = [
    "#ef4444", "#3b82f6", "#22c55e", "#f97316",
    "#a855f7", "#eab308", "#ec4899", "#06b6d4",
];

// ─── Component ───────────────────────────────────────────────────────────────
export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
    imageUrl,
    existingLayers,
    onSave,
    onClose,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);       // pen strokes
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // rect drawings
    const containerRef = useRef<HTMLDivElement>(null);

    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [layers, setLayers] = useState<AnnotationLayer[]>(existingLayers);
    const [canvasReady, setCanvasReady] = useState(false);
    const [hasImage, setHasImage] = useState(false);
    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

    // Refs for drawing (avoids stale closures)
    const isDrawingRef = useRef(false);
    const toolRef = useRef<Tool>(tool);
    const colorRef = useRef(color);
    useEffect(() => { toolRef.current = tool; }, [tool]);
    useEffect(() => { colorRef.current = color; }, [color]);

    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Rect tool state
    const rectStartRef = useRef<{ x: number; y: number } | null>(null);
    const rectsRef = useRef<RectDef[]>([]); // committed rects (drawn on overlay)

    // ─── Undo / Redo ─────────────────────────────────────────────────────────
    const undoStackRef = useRef<UndoState[]>([]);
    const redoStackRef = useRef<UndoState[]>([]);
    const [undoCount, setUndoCount] = useState(0);
    const [redoCount, setRedoCount] = useState(0);

    const captureState = (): UndoState | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        return {
            canvasData: ctx.getImageData(0, 0, canvas.width, canvas.height),
            rects: [...rectsRef.current],
        };
    };

    const pushUndo = () => {
        const state = captureState();
        if (!state) return;
        undoStackRef.current.push(state);
        if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();
        redoStackRef.current = [];
        setUndoCount(undoStackRef.current.length);
        setRedoCount(0);
    };

    const restoreState = (state: UndoState) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.putImageData(state.canvasData, 0, 0);
        rectsRef.current = [...state.rects];
        redrawOverlay();
    };

    const undo = () => {
        if (undoStackRef.current.length === 0) return;
        const current = captureState();
        if (current) redoStackRef.current.push(current);
        const prev = undoStackRef.current.pop()!;
        restoreState(prev);
        setUndoCount(undoStackRef.current.length);
        setRedoCount(redoStackRef.current.length);
    };

    const redo = () => {
        if (redoStackRef.current.length === 0) return;
        const current = captureState();
        if (current) undoStackRef.current.push(current);
        const next = redoStackRef.current.pop()!;
        restoreState(next);
        setUndoCount(undoStackRef.current.length);
        setRedoCount(redoStackRef.current.length);
    };

    const resetHistory = () => {
        undoStackRef.current = [];
        redoStackRef.current = [];
        rectsRef.current = [];
        setUndoCount(0);
        setRedoCount(0);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                e.preventDefault();
                e.shiftKey ? redo() : undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // ─── Redraw overlay with committed rects (grouped by color, no stacking) ─
    const redrawOverlay = (previewRect?: RectDef) => {
        const overlay = overlayCanvasRef.current;
        if (!overlay) return;
        const ctx = overlay.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        // Group rects by color so same-color rects don't stack opacity
        const allRects = previewRect ? [...rectsRef.current, previewRect] : rectsRef.current;
        const groups = new Map<string, RectDef[]>();
        for (const r of allRects) {
            if (!groups.has(r.color)) groups.set(r.color, []);
            groups.get(r.color)!.push(r);
        }

        // Draw each color group as a single path → no stacking
        for (const [groupColor, rects] of groups) {
            ctx.save();
            ctx.globalAlpha = RECT_OPACITY;
            ctx.fillStyle = groupColor;

            // Build a combined region for fill
            ctx.beginPath();
            for (const r of rects) {
                const nx = r.w < 0 ? r.x + r.w : r.x;
                const ny = r.h < 0 ? r.y + r.h : r.y;
                const nw = Math.abs(r.w);
                const nh = Math.abs(r.h);
                ctx.rect(nx, ny, nw, nh);
            }
            ctx.fill("nonzero");
            ctx.restore();
        }
    };

    // ─── Image loading ───────────────────────────────────────────────────────
    const imgRef = useRef<HTMLImageElement | null>(null);

    const fitToContainer = useCallback((aspect: number) => {
        const container = containerRef.current;
        if (!container) return;
        const maxW = container.clientWidth - 32;
        const maxH = container.clientHeight - 32;
        let w = maxW;
        let h = w / aspect;
        if (h > maxH) { h = maxH; w = h * aspect; }
        setCanvasSize({ width: Math.floor(Math.max(w, 200)), height: Math.floor(Math.max(h, 150)) });
        setCanvasReady(true);
    }, []);

    useEffect(() => {
        const timer = requestAnimationFrame(() => fitToContainer(16 / 9));
        if (imageUrl && imageUrl.trim().length > 0) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => { imgRef.current = img; setHasImage(true); fitToContainer(img.naturalWidth / img.naturalHeight); };
            img.onerror = () => setHasImage(false);
            img.src = imageUrl;
        }
        return () => cancelAnimationFrame(timer);
    }, [imageUrl, fitToContainer]);

    useEffect(() => {
        const handleResize = () => fitToContainer(imgRef.current ? imgRef.current.naturalWidth / imgRef.current.naturalHeight : 16 / 9);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [fitToContainer]);

    // ─── Mouse position ──────────────────────────────────────────────────────
    const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // ─── Drawing handlers ────────────────────────────────────────────────────
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getPos(e);
        isDrawingRef.current = true;
        pushUndo();

        if (toolRef.current === "pen") {
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = colorRef.current;
            ctx.globalAlpha = PEN_OPACITY;
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        } else {
            rectStartRef.current = pos;
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        const pos = getPos(e);

        if (toolRef.current === "pen") {
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            ctx.globalAlpha = PEN_OPACITY;
            ctx.strokeStyle = colorRef.current;
            ctx.lineWidth = 4;
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (toolRef.current === "rect" && rectStartRef.current) {
            // Show live preview including all committed rects + the in-progress one
            const preview: RectDef = {
                x: rectStartRef.current.x,
                y: rectStartRef.current.y,
                w: pos.x - rectStartRef.current.x,
                h: pos.y - rectStartRef.current.y,
                color: colorRef.current,
            };
            redrawOverlay(preview);
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        if (toolRef.current === "rect" && rectStartRef.current) {
            const pos = getPos(e);
            const newRect: RectDef = {
                x: rectStartRef.current.x,
                y: rectStartRef.current.y,
                w: pos.x - rectStartRef.current.x,
                h: pos.y - rectStartRef.current.y,
                color: colorRef.current,
            };
            // Only add non-trivial rects
            if (Math.abs(newRect.w) > 2 && Math.abs(newRect.h) > 2) {
                rectsRef.current.push(newRect);
            }
            rectStartRef.current = null;
            redrawOverlay(); // redraw without preview
        }
    };

    // ─── Canvas helpers ──────────────────────────────────────────────────────
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        rectsRef.current = [];
        redrawOverlay();
    };

    // Merge pen canvas + rect overlay into a single data URL
    const getMergedDataUrl = () => {
        const main = canvasRef.current;
        const overlay = overlayCanvasRef.current;
        if (!main) return "";
        const temp = document.createElement("canvas");
        temp.width = main.width;
        temp.height = main.height;
        const ctx = temp.getContext("2d")!;
        ctx.drawImage(main, 0, 0);
        if (overlay) ctx.drawImage(overlay, 0, 0);
        return temp.toDataURL("image/png");
    };

    const canvasHasContent = () => {
        if (rectsRef.current.length > 0) return true;
        const canvas = canvasRef.current;
        if (!canvas) return false;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return false;
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return pixels.some((_, i) => i % 4 === 3 && pixels[i] > 0);
    };

    // ─── Auto-save current layer ─────────────────────────────────────────────
    const autoSaveCurrentLayer = () => {
        if (!editingLayerId) return;
        if (!canvasHasContent()) return;
        const dataUrl = getMergedDataUrl();
        setLayers((prev) =>
            prev.map((l) => l.id === editingLayerId ? { ...l, drawingDataUrl: dataUrl, color: colorRef.current } : l)
        );
    };

    // ─── Load layer onto canvas ──────────────────────────────────────────────
    const loadLayerToCanvas = (layer: AnnotationLayer) => {
        autoSaveCurrentLayer();
        // Clear both canvases
        const main = canvasRef.current;
        if (main) main.getContext("2d")?.clearRect(0, 0, main.width, main.height);
        rectsRef.current = [];
        redrawOverlay();
        resetHistory();
        setEditingLayerId(layer.id);
        setColor(layer.color);

        if (!main || !layer.drawingDataUrl) return;
        const ctx = main.getContext("2d");
        if (!ctx) return;
        const img = new Image();
        // Note: loaded layers are flattened (pen+old rects merged).
        // Rect objects are lost after save—future rects drawn on top are still non-stacking.
        img.onload = () => ctx.drawImage(img, 0, 0, main.width, main.height);
        img.src = layer.drawingDataUrl;
    };

    // ─── New Layer ───────────────────────────────────────────────────────────
    const newLayer = () => {
        autoSaveCurrentLayer();
        const main = canvasRef.current;
        if (main) main.getContext("2d")?.clearRect(0, 0, main.width, main.height);
        rectsRef.current = [];
        redrawOverlay();
        resetHistory();

        const layer: AnnotationLayer = {
            id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `Layer ${layers.length + 1}`,
            drawingDataUrl: "",
            color: colorRef.current,
            order: layers.length,
            audio: {
                durationInSeconds: 3,
                transcript: "",
            },
        };
        setLayers((prev) => [...prev, layer]);
        setEditingLayerId(layer.id);
    };

    // ─── Remove layer ────────────────────────────────────────────────────────
    const removeLayer = (id: string) => {
        if (editingLayerId === id) {
            setEditingLayerId(null);
            const main = canvasRef.current;
            if (main) main.getContext("2d")?.clearRect(0, 0, main.width, main.height);
            rectsRef.current = [];
            redrawOverlay();
            resetHistory();
        }
        setLayers((prev) => prev.filter((l) => l.id !== id));
    };

    // ─── Done ────────────────────────────────────────────────────────────────
    const handleDone = () => {
        // Because setLayers is async, calling autoSaveCurrentLayer() right before
        // reading `layers` will read the stale old array.
        // We need to manually construct the final array here.
        let finalLayers = [...layers];

        if (editingLayerId && canvasHasContent()) {
            const dataUrl = getMergedDataUrl();
            finalLayers = finalLayers.map((l) =>
                l.id === editingLayerId
                    ? { ...l, drawingDataUrl: dataUrl, color: colorRef.current }
                    : l
            );
        }

        const validLayers = finalLayers.filter((l) => l.drawingDataUrl && l.drawingDataUrl.length > 0);
        onSave(validLayers);
        onClose();
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1400px] h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-xl">🖊️</span> Annotate Map
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 flex flex-col">
                        {/* Toolbar */}
                        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white flex-wrap">
                            {/* Tools */}
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                <button type="button" onClick={() => setTool("pen")}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tool === "pen" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                                    ✏️ Pen
                                </button>
                                <button type="button" onClick={() => setTool("rect")}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tool === "rect" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                                    ▭ Rect
                                </button>
                            </div>

                            <div className="w-px h-6 bg-gray-300" />

                            {/* Colors */}
                            <div className="flex items-center gap-1.5">
                                {PRESET_COLORS.map((c) => (
                                    <button type="button" key={c} onClick={() => setColor(c)}
                                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-gray-900 scale-110 ring-2 ring-gray-300" : "border-gray-300"}`}
                                        style={{ backgroundColor: c, opacity: 0.5 }} />
                                ))}
                                <label className="relative w-7 h-7 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:border-gray-600 transition-colors overflow-hidden">
                                    <span className="text-xs text-gray-500">+</span>
                                    <input type="color" value={color || "#ff0000"} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </label>
                            </div>

                            <div className="w-px h-6 bg-gray-300" />

                            {/* Undo / Redo */}
                            <div className="flex items-center gap-1">
                                <button type="button" onClick={undo} disabled={undoCount === 0}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Undo (Ctrl+Z)">
                                    <Undo2 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={redo} disabled={redoCount === 0}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Redo (Ctrl+Shift+Z)">
                                    <Redo2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="w-px h-6 bg-gray-300" />

                            <button type="button" onClick={() => { pushUndo(); clearCanvas(); }}
                                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                🗑 Clear
                            </button>
                        </div>

                        {/* Canvas */}
                        <div ref={containerRef} className="flex-1 flex items-center justify-center bg-gray-900 overflow-hidden p-4">
                            {canvasReady && canvasSize.width > 0 && (
                                <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
                                    {hasImage ? (
                                        <img src={imageUrl} alt="CAD base" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none rounded" draggable={false} />
                                    ) : (
                                        <div className="absolute inset-0 bg-white rounded" />
                                    )}
                                    {/* Main canvas (pen strokes) */}
                                    <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height}
                                        className="absolute inset-0 rounded" style={{ cursor: "crosshair" }}
                                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
                                    {/* Overlay canvas (rects — non-stacking) */}
                                    <canvas ref={overlayCanvasRef} width={canvasSize.width} height={canvasSize.height}
                                        className="absolute inset-0 pointer-events-none rounded" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-72 border-l border-gray-200 bg-gray-50 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Layers ({layers.length})
                            </h3>
                            <button type="button" onClick={newLayer}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors" title="New Layer">
                                <Plus className="w-3.5 h-3.5" /> New
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {layers.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-8">
                                    Click <b>"+ New"</b> to create<br />your first annotation layer
                                </p>
                            ) : (
                                layers.map((layer) => (
                                    <React.Fragment key={layer.id}>
                                        <div onClick={() => loadLayerToCanvas(layer)}
                                            className={`rounded-lg border p-3 shadow-sm cursor-pointer transition-all hover:shadow-md ${editingLayerId === layer.id ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200" : "bg-white border-gray-200 hover:border-gray-300"
                                                }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-800">
                                                    {layer.name}
                                                    {editingLayerId === layer.id && <span className="ml-1.5 text-xs text-blue-600 font-normal">editing</span>}
                                                </span>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            {layer.drawingDataUrl ? (
                                                <img src={layer.drawingDataUrl} alt={layer.name} className="w-full h-16 object-contain bg-gray-100 rounded border border-gray-200" />
                                            ) : (
                                                <div className="w-full h-16 flex items-center justify-center bg-gray-100 rounded border border-gray-200 text-xs text-gray-400">
                                                    Empty — click to draw
                                                </div>
                                            )}
                                            <div className="w-4 h-4 rounded-full mt-2 border border-gray-300" style={{ backgroundColor: layer.color, opacity: 0.5 }} />
                                        </div>
                                    </React.Fragment>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200">
                            <button type="button" onClick={handleDone}
                                className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                                Done ({layers.length} layer{layers.length !== 1 ? "s" : ""})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
