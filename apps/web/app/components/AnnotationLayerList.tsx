import * as React from "react";
import { GripVertical, Trash2, Mic, Loader2 } from "lucide-react";
import type { AnnotationLayer } from "@repo/shared";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Sortable Layer Item ─────────────────────────────────────────────────────
function SortableLayerItem({
    layer,
    onTranscriptChange,
    onDurationChange,
    onRemove,
    onGenerateSpeech,
    isGenerating,
}: {
    layer: AnnotationLayer;
    onTranscriptChange: (id: string, transcript: string) => void;
    onDurationChange: (id: string, duration: number) => void;
    onRemove: (id: string) => void;
    onGenerateSpeech?: (layerId: string) => void;
    isGenerating?: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: layer.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.8 : 1,
    };

    const hasAudio = !!layer.audio?.audioUrl;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-3 bg-white rounded-lg border transition-shadow ${isDragging ? "shadow-lg border-blue-300 ring-2 ring-blue-100" : "border-gray-200 shadow-sm"
                }`}
        >
            {/* Top row: drag handle, thumbnail, name, delete */}
            <div className="flex items-center gap-3">
                {/* Drag handle */}
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-4 h-4" />
                </button>

                {/* Thumbnail */}
                <div className="flex-shrink-0 w-14 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                    {layer.drawingDataUrl ? (
                        <img
                            src={layer.drawingDataUrl}
                            alt={layer.name}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                    )}
                </div>

                {/* Name + color indicator */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300"
                            style={{ backgroundColor: layer.color, opacity: 0.6 }}
                        />
                        <span className="text-sm font-medium text-gray-800 truncate">
                            {layer.name}
                        </span>
                    </div>
                    {/* Audio duration badge */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-400">
                            {layer.audio?.durationInSeconds?.toFixed(1) || "0.0"}s
                        </span>
                        {hasAudio && (
                            <span className="text-xs text-green-600 font-medium">● Audio</span>
                        )}
                    </div>
                </div>

                {/* Delete */}
                <button
                    type="button"
                    onClick={() => onRemove(layer.id)}
                    className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove layer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Transcript + Generate Speech row */}
            <div className="mt-2 space-y-2">
                <textarea
                    value={layer.audio?.transcript || ""}
                    onChange={(e) => onTranscriptChange(layer.id, e.target.value)}
                    placeholder="Enter transcript for this layer..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none bg-gray-50 placeholder-gray-400"
                />
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        disabled={!layer.audio?.transcript?.trim() || isGenerating}
                        onClick={() => onGenerateSpeech?.(layer.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-indigo-200"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Mic className="w-3 h-3" />
                        )}
                        {isGenerating ? "Generating..." : "Generate Speech"}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium whitespace-nowrap">
                        <label htmlFor={`duration-${layer.id}`}>Duration (s)</label>
                        <input
                            id={`duration-${layer.id}`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={layer.audio?.durationInSeconds || 0}
                            onChange={(e) => onDurationChange(layer.id, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 font-normal shadow-sm bg-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Layer List ─────────────────────────────────────────────────────────
interface AnnotationLayerListProps {
    layers: AnnotationLayer[];
    onChange: (layers: AnnotationLayer[]) => void;
    onGenerateSpeech?: (transcript: string, fieldPath: string) => Promise<void>;
    compositionId?: string;
    generatingLayerId?: string;
}

export const AnnotationLayerList: React.FC<AnnotationLayerListProps> = ({
    layers,
    onChange,
    onGenerateSpeech,
    compositionId,
    generatingLayerId,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = layers.findIndex((l) => l.id === active.id);
            const newIndex = layers.findIndex((l) => l.id === over.id);
            const reordered = arrayMove(layers, oldIndex, newIndex).map(
                (l, i) => ({ ...l, order: i })
            );
            onChange(reordered);
        }
    };

    const handleTranscriptChange = (id: string, transcript: string) => {
        onChange(layers.map((l) =>
            l.id === id
                ? { ...l, audio: { ...l.audio, transcript } }
                : l
        ));
    };

    const handleDurationChange = (id: string, durationInSeconds: number) => {
        onChange(layers.map((l) =>
            l.id === id
                ? { ...l, audio: { ...l.audio, durationInSeconds } }
                : l
        ));
    };

    const handleRemove = (id: string) => {
        onChange(
            layers
                .filter((l) => l.id !== id)
                .map((l, i) => ({ ...l, order: i }))
        );
    };

    const handleGenerateSpeech = async (layerId: string) => {
        const layer = layers.find((l) => l.id === layerId);
        if (!layer?.audio?.transcript || !onGenerateSpeech) return;

        // Find the index of this layer in the annotations array
        const layerIndex = layers.findIndex((l) => l.id === layerId);
        if (layerIndex === -1) return;

        // Generate speech via the parent callback — use the field path for this specific layer's transcript
        const fieldPath = `cadFileSection.annotations.${layerIndex}.audio.transcript`;
        await onGenerateSpeech(layer.audio.transcript, fieldPath);
    };

    if (layers.length === 0) {
        return (
            <div className="text-center py-4 text-xs text-gray-400">
                No annotation layers yet. Click "Annotate Map" to start drawing.
            </div>
        );
    }

    const totalDuration = layers.reduce((sum, l) => sum + (l.audio?.durationInSeconds || 0), 0);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Annotation Layers
                </span>
                <span className="text-xs text-gray-400">
                    Total: {totalDuration.toFixed(1)}s
                </span>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={layers.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {layers.map((layer) => (
                        <SortableLayerItem
                            key={layer.id}
                            layer={layer}
                            onTranscriptChange={handleTranscriptChange}
                            onDurationChange={handleDurationChange}
                            onRemove={handleRemove}
                            onGenerateSpeech={handleGenerateSpeech}
                            isGenerating={generatingLayerId === layer.id}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};
