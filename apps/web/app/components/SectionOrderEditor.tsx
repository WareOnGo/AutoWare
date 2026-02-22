import React from "react";
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
import { SECTION_DISPLAY_NAMES, type SectionKey } from "@repo/shared";

interface SortableItemProps {
    id: string;
    index: number;
}

function SortableItem({ id, index }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const displayName = SECTION_DISPLAY_NAMES[id as SectionKey] || id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border
        transition-shadow select-none
        ${isDragging
                    ? "bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }
      `}
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Drag to reorder"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="5" cy="3" r="1.5" />
                    <circle cx="11" cy="3" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" />
                    <circle cx="11" cy="8" r="1.5" />
                    <circle cx="5" cy="13" r="1.5" />
                    <circle cx="11" cy="13" r="1.5" />
                </svg>
            </button>

            {/* Index number */}
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
                {index + 1}
            </span>

            {/* Section name */}
            <span className="font-medium text-gray-800 text-sm">{displayName}</span>
        </div>
    );
}

interface SectionOrderEditorProps {
    value: string[];
    onChange: (newOrder: string[]) => void;
}

export function SectionOrderEditor({ value, onChange }: SectionOrderEditorProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 4,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = value.indexOf(active.id as string);
            const newIndex = value.indexOf(over.id as string);
            onChange(arrayMove(value, oldIndex, newIndex));
        }
    }

    return (
        <div className="border rounded-lg bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Section Order
                </h3>
                <span className="text-xs text-gray-400">Drag to reorder</span>
            </div>

            <div className="space-y-1">
                {/* Fixed: Intro */}
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                    <span className="flex-shrink-0 text-gray-300 p-1">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
                            <circle cx="5" cy="3" r="1.5" />
                            <circle cx="11" cy="3" r="1.5" />
                            <circle cx="5" cy="8" r="1.5" />
                            <circle cx="11" cy="8" r="1.5" />
                            <circle cx="5" cy="13" r="1.5" />
                            <circle cx="11" cy="13" r="1.5" />
                        </svg>
                    </span>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center">
                        —
                    </span>
                    <span className="font-medium text-gray-400 text-sm">Intro</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-300 font-semibold">Fixed</span>
                </div>

                {/* Draggable sections */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={value} strategy={verticalListSortingStrategy}>
                        {value.map((key, index) => (
                            <SortableItem key={key} id={key} index={index} />
                        ))}
                    </SortableContext>
                </DndContext>

                {/* Fixed: Outro */}
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                    <span className="flex-shrink-0 text-gray-300 p-1">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
                            <circle cx="5" cy="3" r="1.5" />
                            <circle cx="11" cy="3" r="1.5" />
                            <circle cx="5" cy="8" r="1.5" />
                            <circle cx="11" cy="8" r="1.5" />
                            <circle cx="5" cy="13" r="1.5" />
                            <circle cx="11" cy="13" r="1.5" />
                        </svg>
                    </span>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center">
                        —
                    </span>
                    <span className="font-medium text-gray-400 text-sm">Outro</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-300 font-semibold">Fixed</span>
                </div>
            </div>
        </div>
    );
}
