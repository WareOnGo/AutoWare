import * as React from "react";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import { z } from "zod";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "./ui/form";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { VideoUpload } from "./VideoUpload";
import { ImageUpload } from "./ImageUpload";
import { MediaUpload } from "./MediaUpload";
import { GoogleMapsInput } from "./GoogleMapsInput";
import { TranscriptInput } from "./TranscriptInput";
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

interface SchemaFormGeneratorProps<T extends FieldValues> {
    schema: z.ZodType<T>;
    form: UseFormReturn<T>;
    basePath?: string;
    onFileSelect?: (fieldPath: string, file: File | null) => void;
    compositionId?: string;
    onSatelliteImageConfirm?: (googleMapsUrl: string) => Promise<void>;
    onGenerateSpeech?: (transcript: string, fieldPath: string) => Promise<void>;
    isGeneratingAudio?: boolean;
    sectionOrder?: string[];
    onSectionOrderChange?: (newOrder: string[]) => void;
    onDraggingChange?: (isDragging: boolean) => void;
}

// Sortable accordion item with drag handle
function SortableAccordionItem({ id, index, children }: { id: string; index: number; children: React.ReactNode }) {
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
        position: 'relative' as const,
    };

    const displayName = SECTION_DISPLAY_NAMES[id as SectionKey] || toTitleCase(id);

    return (
        <AccordionItem value={id} className={`border rounded-lg bg-white shadow-sm px-4 ${isDragging ? 'ring-2 ring-blue-200 shadow-lg' : ''}`} ref={setNodeRef} style={style}>
            <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 w-full">
                    {/* Drag handle */}
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Drag to reorder"
                        onClick={(e) => e.stopPropagation()}
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
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{displayName}</span>
                </div>
            </AccordionTrigger>
            {children}
        </AccordionItem>
    );
}

// Sensors for DnD (defined outside component to avoid re-creation)
function useDndSensors() {
    return useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
}

// Helper to convert camelCase to Title Case
const toTitleCase = (str: string): string => {
    return str
        .replace(/VideoUrl$/i, 'Video') // Replace "VideoUrl" with "Video"
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
};

// Helper to get field type
const getFieldType = (zodType: any): string => {
    const typeName = zodType._def?.typeName;

    if (typeName === "ZodOptional" || typeName === "ZodNullable") {
        return getFieldType(zodType._def.innerType);
    }

    // Handle ZodUnion (e.g., MediaUrl which is string.refine().or(z.literal("")))
    if (typeName === "ZodUnion") {
        // For unions, check the first option - MediaUrl unions are string | ""
        const options = zodType._def.options;
        if (options && options.length > 0) {
            return getFieldType(options[0]);
        }
    }

    // Handle ZodEffects (refinement)
    if (typeName === "ZodEffects") {
        return getFieldType(zodType._def.schema);
    }

    return typeName;
};

// Render a single field based on its Zod type
function renderField<T extends FieldValues>(
    key: string,
    zodType: any,
    form: UseFormReturn<T>,
    basePath?: string,
    onFileSelect?: (fieldPath: string, file: File | null) => void,
    compositionId?: string,
    onSatelliteImageConfirm?: (googleMapsUrl: string) => Promise<void>,
    onGenerateSpeech?: (transcript: string, fieldPath: string) => Promise<void>
): React.ReactNode {
    const fieldPath = basePath ? `${basePath}.${key}` : key;
    const label = toTitleCase(key);
    const fieldType = getFieldType(zodType);

    // Skip sectionOrder - handled by SectionOrderEditor component
    if (key === "sectionOrder") {
        return null;
    }

    // Skip audio URL fields - we'll handle TTS conversion later
    if (key === "audioUrl") {
        return null;
    }

    // Skip durationInSeconds - it's automatically managed by TTS generation
    if (key === "durationInSeconds") {
        return null;
    }

    // Skip satelliteImageUrl - it's automatically generated from Google Maps URL
    if (key === "satelliteImageUrl") {
        return null;
    }

    // Handle transcript fields with TranscriptInput component
    if (key === "transcript" && fieldType === "ZodString") {
        // Extract the parent path (e.g., "satDroneSection.audio" from "satDroneSection.audio.transcript")
        const parentPath = basePath || "";

        // Get sibling fields from the audio object
        const audioUrlPath = `${parentPath}.audioUrl` as FieldPath<T>;
        const audioDurationPath = `${parentPath}.durationInSeconds` as FieldPath<T>;

        const audioUrl = form.watch(audioUrlPath);
        const audioDuration = form.watch(audioDurationPath);

        return (
            <FormField
                key={fieldPath}
                control={form.control}
                name={fieldPath as FieldPath<T>}
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <TranscriptInput
                                value={field.value}
                                onChange={field.onChange}
                                audioUrl={audioUrl}
                                audioDuration={audioDuration}
                                onGenerateSpeech={onGenerateSpeech}
                                fieldPath={fieldPath}
                                label={label}
                                compositionId={compositionId}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    }

    // Handle nested objects
    if (fieldType === "ZodObject") {
        const shape = zodType._def.shape();

        // Special case: location objects with lat/lng - use GoogleMapsInput
        if (shape.lat && shape.lng && Object.keys(shape).length === 2) {
            return (
                <FormField
                    key={fieldPath}
                    control={form.control}
                    name={fieldPath as FieldPath<T>}
                    render={({ field }) => (
                        <GoogleMapsInput
                            value={field.value}
                            onChange={field.onChange}
                            label={label}
                            compositionId={compositionId}
                            onConfirm={onSatelliteImageConfirm}
                        />
                    )}
                />
            );
        }

        return (
            <div key={fieldPath} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{label}</h3>
                <div className="space-y-4">
                    {Object.entries(shape).map(([nestedKey, nestedType]) =>
                        renderField(nestedKey, nestedType, form, fieldPath, onFileSelect, compositionId, onSatelliteImageConfirm, onGenerateSpeech)
                    )}
                </div>
            </div>
        );
    }

    // Handle arrays
    if (fieldType === "ZodArray") {
        const elementType = zodType._def.type;
        // For array of objects (like nearbyPoints)
        if (getFieldType(elementType) === "ZodObject") {
            const arrayValue = form.watch(fieldPath as any) || [];

            return (
                <div key={fieldPath} className="space-y-3">
                    <FormLabel className="text-base font-semibold text-gray-900">{label}</FormLabel>
                    <div className="space-y-3">
                        {arrayValue.map((_, index: number) => {
                            const shape = elementType._def.shape();
                            return (
                                <div key={`${fieldPath}.${index}`} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-4 relative group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-500">Item {index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = form.getValues(fieldPath as any);
                                                const updated = current.filter((_: any, i: number) => i !== index);
                                                form.setValue(fieldPath as any, updated);
                                            }}
                                            className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            Remove Item
                                        </button>
                                    </div>
                                    {Object.entries(shape).map(([nestedKey, nestedType]) =>
                                        renderField(nestedKey, nestedType, form, `${fieldPath}.${index}`, onFileSelect, compositionId, onSatelliteImageConfirm, onGenerateSpeech)
                                    )}
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => {
                                const current = form.getValues(fieldPath as any) || [];
                                const defaultItem: any = {};
                                // Create default object based on shape
                                Object.entries(elementType._def.shape()).forEach(([k, v]: [string, any]) => {
                                    const fType = getFieldType(v);
                                    if (fType === "ZodString") defaultItem[k] = "";
                                    else if (fType === "ZodNumber") defaultItem[k] = 0;
                                    else if (fType === "ZodBoolean") defaultItem[k] = false;
                                });
                                form.setValue(fieldPath as any, [...current, defaultItem]);
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                            <span>+</span> Add {toTitleCase(key.replace(/s$/, ""))}
                        </button>
                    </div>
                </div>
            );
        }
    }

    // Handle enum
    if (fieldType === "ZodEnum") {
        const options = zodType._def.values;
        return (
            <FormField
                key={fieldPath}
                control={form.control}
                name={fieldPath as FieldPath<T>}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {options.map((option: string) => (
                                    <SelectItem key={option} value={option}>
                                        {toTitleCase(option)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    }

    // Handle boolean
    if (fieldType === "ZodBoolean") {
        return (
            <FormField
                key={fieldPath}
                control={form.control}
                name={fieldPath as FieldPath<T>}
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50/30">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">{label}</FormLabel>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        );
    }

    // Handle number
    if (fieldType === "ZodNumber") {
        // Special handling for sectionDurationInSeconds - validate against audio duration
        if (key === "sectionDurationInSeconds") {
            // Get the audio duration from the sibling audio object
            const parentPath = basePath || "";
            const audioDurationPath = `${parentPath}.audio.durationInSeconds` as FieldPath<T>;
            const audioDuration = form.watch(audioDurationPath);

            // Calculate minimum duration
            const minDuration = audioDuration ? audioDuration + 1.0 : 0;

            return (
                <FormField
                    key={fieldPath}
                    control={form.control}
                    name={fieldPath as FieldPath<T>}
                    rules={{
                        validate: (value) => {
                            if (!value) return true; // Optional field
                            if (!audioDuration || audioDuration <= 0) return true; // No audio, no validation needed

                            const minRequired = audioDuration + 1.0;
                            if (value < minRequired) {
                                return `Section duration must be at least ${minRequired.toFixed(1)} seconds (audio length + 1s buffer)`;
                            }
                            return true;
                        }
                    }}
                    render={({ field, fieldState }) => (
                        <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min={minDuration}
                                    placeholder={minDuration > 0 ? `Default: ${minDuration.toFixed(1)}s` : "Optional"}
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                        field.onChange(value);
                                    }}
                                    className="bg-gray-50/30 focus:bg-white transition-colors"
                                />
                            </FormControl>
                            {audioDuration > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimum: {minDuration.toFixed(1)}s (audio: {audioDuration.toFixed(1)}s + 1s buffer)
                                </p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
            );
        }

        // Special handling for video duration fields
        if (key.toLowerCase().includes('duration')) {
            return (
                <FormField
                    key={fieldPath}
                    control={form.control}
                    name={fieldPath as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min={0}
                                    placeholder="0 (seconds)"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseFloat(e.target.value) : 0;
                                        field.onChange(value);
                                    }}
                                    className="bg-gray-50/30 focus:bg-white transition-colors"
                                />
                            </FormControl>
                            <p className="text-xs text-gray-500 mt-1">
                                Current: {field.value || 0} seconds
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            );
        }

        return (
            <FormField
                key={fieldPath}
                control={form.control}
                name={fieldPath as FieldPath<T>}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                step="any"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="bg-gray-50/30 focus:bg-white transition-colors"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    }

    // Handle string (check for video and image fields by name)
    if (fieldType === "ZodString") {
        // Use VideoUpload for any field containing "video" in the name
        if (key.toLowerCase().includes("video")) {
            return (
                <FormField
                    key={fieldPath}
                    control={form.control}
                    name={fieldPath as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">{label}</FormLabel>
                            <FormControl>
                                <VideoUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    onFileSelect={(file) => onFileSelect?.(fieldPath, file)}
                                    label={`Upload ${label}`}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            );
        }

        // Use ImageUpload for any field containing "image" in the name
        if (key.toLowerCase().includes("image")) {
            return (
                <FormField
                    key={fieldPath}
                    control={form.control}
                    name={fieldPath as FieldPath<T>}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-medium">{label}</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    onFileSelect={(file) => onFileSelect?.(fieldPath, file)}
                                    label={`Upload ${label}`}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            );
        }

        return (
            <FormField
                key={fieldPath}
                control={form.control}
                name={fieldPath as FieldPath<T>}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                            <Input {...field} className="bg-gray-50/30 focus:bg-white transition-colors" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    }

    return null;
}

export function SchemaFormGenerator<T extends FieldValues>({
    schema,
    form,
    basePath,
    onFileSelect,
    compositionId,
    onSatelliteImageConfirm,
    onGenerateSpeech,
    isGeneratingAudio,
    sectionOrder,
    onSectionOrderChange,
    onDraggingChange,
}: SchemaFormGeneratorProps<T>) {
    // Get the schema shape
    const schemaType = schema as any;

    if (schemaType._def?.typeName !== "ZodObject") {
        return <div>Schema must be a ZodObject</div>;
    }

    const shape = schemaType._def.shape();

    // Separate orderable sections from non-sections
    const allEntries = Object.entries(shape);
    const nonSectionEntries = allEntries.filter(([key, zodType]) => {
        if (key === "sectionOrder") return false;
        return getFieldType(zodType) !== "ZodObject" || !sectionOrder?.includes(key);
    });
    const sectionEntries = allEntries.filter(([key, zodType]) => {
        return getFieldType(zodType) === "ZodObject" && sectionOrder?.includes(key);
    });

    // Build a map for quick lookup
    const sectionMap = new Map(sectionEntries);

    // Determine order: use sectionOrder if available, otherwise schema order
    const orderedSectionKeys = sectionOrder && onSectionOrderChange
        ? sectionOrder.filter(key => sectionMap.has(key))
        : sectionEntries.map(([key]) => key);

    // Determine default open value
    const defaultOpenValue = nonSectionEntries.length > 0 ? nonSectionEntries[0][0] : orderedSectionKeys[0];

    const renderSectionItem = (key: string) => {
        const zodType = sectionMap.get(key) || shape[key];
        if (!zodType) return null;
        const sectionShape = (zodType as any)._def.shape();
        const hasVideoUrl = sectionShape.videoUrl !== undefined;
        const hasImageUrl = sectionShape.imageUrl !== undefined;
        const shouldUseMediaUpload = hasVideoUrl && hasImageUrl;

        return (
            <AccordionContent className="pt-2 pb-6">
                <div className="space-y-6">
                    {Object.entries(sectionShape).map(([childKey, childType]) => {
                        if (shouldUseMediaUpload && (childKey === 'videoUrl' || childKey === 'imageUrl')) {
                            if (childKey === 'videoUrl') {
                                const videoFieldPath = `${key}.videoUrl` as FieldPath<T>;
                                const imageFieldPath = `${key}.imageUrl` as FieldPath<T>;
                                return (
                                    <div key={`${key}-media`}>
                                        <FormLabel className="text-base font-medium">Media (Video or Image)</FormLabel>
                                        <MediaUpload
                                            videoValue={form.watch(videoFieldPath)}
                                            imageValue={form.watch(imageFieldPath)}
                                            onVideoChange={(url) => form.setValue(videoFieldPath, url as any)}
                                            onImageChange={(url) => form.setValue(imageFieldPath, url as any)}
                                            onFileSelect={(file, type) => {
                                                if (file) {
                                                    const targetPath = type === 'video' ? videoFieldPath : imageFieldPath;
                                                    onFileSelect?.(targetPath, file);
                                                }
                                            }}
                                            label="Upload Video or Image"
                                        />
                                    </div>
                                );
                            }
                            return null;
                        }
                        return renderField(childKey, childType, form, key, onFileSelect, compositionId, onSatelliteImageConfirm, onGenerateSpeech);
                    })}
                </div>
            </AccordionContent>
        );
    };

    const sensors = useDndSensors();
    const hasDnd = sectionOrder && onSectionOrderChange && orderedSectionKeys.length > 0;
    const [openSection, setOpenSection] = React.useState<string>("");

    return (
        <div className="w-full space-y-4">
            {/* Non-section fields (e.g. intro) */}
            {nonSectionEntries.length > 0 && (
                <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={defaultOpenValue}>
                    {nonSectionEntries.map(([key, zodType]) => {
                        const isSection = getFieldType(zodType) === "ZodObject";
                        if (isSection) {
                            return (
                                <AccordionItem value={key} key={key} className="border rounded-lg bg-white shadow-sm px-4">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <span className="text-lg font-semibold text-gray-900">{toTitleCase(key)}</span>
                                    </AccordionTrigger>
                                    {renderSectionItem(key)}
                                </AccordionItem>
                            );
                        }
                        return (
                            <div key={key} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                                {renderField(key, zodType, form, basePath, onFileSelect, compositionId, onSatelliteImageConfirm, onGenerateSpeech)}
                            </div>
                        );
                    })}
                </Accordion>
            )}

            {/* Sortable section accordion items */}
            {hasDnd ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={() => {
                        // Collapse any expanded section before dragging
                        setOpenSection("");
                        onDraggingChange?.(true);
                    }}
                    onDragEnd={(event: DragEndEvent) => {
                        onDraggingChange?.(false);
                        const { active, over } = event;
                        if (over && active.id !== over.id) {
                            const oldIndex = orderedSectionKeys.indexOf(active.id as string);
                            const newIndex = orderedSectionKeys.indexOf(over.id as string);
                            onSectionOrderChange!(arrayMove(orderedSectionKeys, oldIndex, newIndex));
                        }
                    }}
                    onDragCancel={() => {
                        onDraggingChange?.(false);
                    }}
                >
                    <SortableContext items={orderedSectionKeys} strategy={verticalListSortingStrategy}>
                        <Accordion type="single" collapsible className="w-full space-y-2" value={openSection} onValueChange={setOpenSection}>
                            {orderedSectionKeys.map((key, index) => (
                                <SortableAccordionItem key={key} id={key} index={index}>
                                    {renderSectionItem(key)}
                                </SortableAccordionItem>
                            ))}
                        </Accordion>
                    </SortableContext>
                </DndContext>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {orderedSectionKeys.map((key) => (
                        <AccordionItem value={key} key={key} className="border rounded-lg bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <span className="text-lg font-semibold text-gray-900">{toTitleCase(key)}</span>
                            </AccordionTrigger>
                            {renderSectionItem(key)}
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}

