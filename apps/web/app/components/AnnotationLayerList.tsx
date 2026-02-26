import * as React from "react";
import { GripVertical, Trash2 } from "lucide-react";
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

import { TranscriptInput } from "./TranscriptInput";

// ─── Sortable Layer Item ─────────────────────────────────────────────────────
function SortableLayerItem({
    layer,
    onTranscriptChange,
    onDurationChange,
    onRemove,
    onGenerateSpeech,
    isGenerating,
    layerIndex,
    compositionId,
}: {
    layer: AnnotationLayer;
    onTranscriptChange: (id: string, transcript: string) => void;
    onDurationChange: (id: string, duration: number) => void;
    onRemove: (id: string) => void;
    onGenerateSpeech?: (transcript: string, fieldPath: string) => Promise<void>;
    isGenerating?: boolean;
    layerIndex: number;
    compositionId?: string;
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

            {/* Transcript + Generate Speech row via TranscriptInput */}
            <div className="mt-2">
                <TranscriptInput
                    value={layer.audio?.transcript || ""}
                    onChange={(value) => onTranscriptChange(layer.id, value)}
                    audioUrl={layer.audio?.audioUrl}
                    audioDuration={layer.audio?.durationInSeconds}
                    onGenerateSpeech={onGenerateSpeech}
                    fieldPath={`cadFileSection.annotations.${layerIndex}.audio.transcript`}
                    compositionId={compositionId}
                    disabled={isGenerating}
                />
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
}

export const AnnotationLayerList: React.FC<AnnotationLayerListProps> = ({
    layers,
    onChange,
    onGenerateSpeech,
    compositionId,
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
                    {layers.map((layer, index) => (
                        <SortableLayerItem
                            key={layer.id}
                            layer={layer}
                            layerIndex={index}
                            compositionId={compositionId}
                            onTranscriptChange={handleTranscriptChange}
                            onDurationChange={handleDurationChange}
                            onRemove={handleRemove}
                            onGenerateSpeech={onGenerateSpeech}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};
