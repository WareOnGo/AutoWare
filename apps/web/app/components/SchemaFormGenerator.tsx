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
import { GoogleMapsInput } from "./GoogleMapsInput";

interface SchemaFormGeneratorProps<T extends FieldValues> {
    schema: z.ZodType<T>;
    form: UseFormReturn<T>;
    basePath?: string;
    onFileSelect?: (fieldPath: string, file: File | null) => void;
}

// Helper to convert camelCase to Title Case
const toTitleCase = (str: string): string => {
    return str
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
};

// Helper to check if a field is a URL field
const isUrlField = (zodType: any): boolean => {
    // Check if it's a string with URL validation
    if (zodType._def?.typeName === "ZodString") {
        const checks = zodType._def.checks || [];
        return checks.some((check: any) => check.kind === "url");
    }
    return false;
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
    onFileSelect?: (fieldPath: string, file: File | null) => void
): React.ReactNode {
    const fieldPath = basePath ? `${basePath}.${key}` : key;
    const label = toTitleCase(key);
    const fieldType = getFieldType(zodType);

    // Skip audio URL fields - we'll handle TTS conversion later
    if (key === "audioUrl") {
        return null;
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
                        renderField(nestedKey, nestedType, form, fieldPath, onFileSelect)
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
                                        renderField(nestedKey, nestedType, form, `${fieldPath}.${index}`, onFileSelect)
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

    // Handle string (check for video fields by name)
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
}: SchemaFormGeneratorProps<T>) {
    // Get the schema shape
    const schemaType = schema as any;

    if (schemaType._def?.typeName !== "ZodObject") {
        return <div>Schema must be a ZodObject</div>;
    }

    const shape = schemaType._def.shape();

    // Determine default open value - open the first section by default
    const defaultOpenValue = Object.keys(shape)[0];

    return (
        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={defaultOpenValue}>
            {Object.entries(shape).map(([key, zodType]) => {
                const isSection = getFieldType(zodType) === "ZodObject";

                if (isSection) {
                    return (
                        <AccordionItem value={key} key={key} className="border rounded-lg bg-white shadow-sm px-4">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <span className="text-lg font-semibold text-gray-900">{toTitleCase(key)}</span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-6">
                                <div className="space-y-6">
                                    {/* Render children of the section manually to skip the wrapper div */}
                                    {Object.entries((zodType as any)._def.shape()).map(([childKey, childType]) =>
                                        renderField(childKey, childType, form, key, onFileSelect)
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                }

                return (
                    <div key={key} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                        {renderField(key, zodType, form, basePath, onFileSelect)}
                    </div>
                );
            })}
        </Accordion>
    );
}
