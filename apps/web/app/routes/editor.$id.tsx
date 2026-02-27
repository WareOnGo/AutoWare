import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Player, type PlayerRef } from "@remotion/player";
import { useParams, useNavigate } from "react-router";
import type { Route } from "./+types/editor.$id";
import stylesheet from "~/app.css?url";
import {
    COMPOSITION_FPS,
    COMPOSITION_HEIGHT,
    COMPOSITION_WIDTH,
} from "~/remotion/constants.mjs";
import { CompositionProps, WarehouseVideoProps, SECTION_KEYS } from "@repo/shared";
import { Main } from "~/remotion/components/Main";
import { Form } from "~/components/ui/form";

import { Button } from "~/components/Button";
import { SchemaFormGenerator } from "~/components/SchemaFormGenerator";
import { PageErrorBoundary } from "~/components/PageErrorBoundary";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { WarehouseDataFetcher } from "~/components/WarehouseDataFetcher";
import { getComposition, updateComposition, generateAudioFromText } from "~/lib/api";
import { uploadBatch, UploadRequest } from "~/lib/upload";
import { useToast } from "~/lib/toast-context";
import { calculateSectionDuration } from "~/lib/utils";
import { useRendering } from "~/lib/use-rendering";
import { COMPOSITION_ID } from "~/remotion/constants.mjs";

export const links: Route.LinksFunction = () => [
    { rel: "stylesheet", href: stylesheet },
];

// Default values for the warehouse video form - Complete sample data
const defaultValues: WarehouseVideoProps = {
    intro: {
        clientName: "Acme Logistics Inc.",
        projectLocationName: "Greater Noida Industrial Hub",
    },
    satDroneSection: {
        location: {
            lat: 28.4744,
            lng: 77.5040,
        },
        droneVideoUrl: "",
        audio: {
            durationInSeconds: 5,
            transcript: "Welcome to Greater Noida Industrial Hub, strategically located for optimal logistics operations.",
        },
    },
    locationSection: {
        nearbyPoints: [
            {
                type: "road",
                name: "Highway NH-24",
                distanceKm: 2,
            },
            {
                type: "railway",
                name: "Noida Metro Station",
                distanceKm: 5,
            },
        ],
        audio: {
            durationInSeconds: 10,
            transcript: "Located just 2 kilometers from NH-24 highway and 5 kilometers from Noida Metro Station.",
        },
    },
    approachRoadSection: {
        videoUrl: "",
        imageUrl: "",
        audio: {
            durationInSeconds: 5,
            transcript: "Approaching the facility via well-maintained access roads.",
        },
    },
    internalWideShotSection: {
        videoUrl: "",
        imageUrl: "",
        specs: {
            clearHeight: "12 meters",
            flooringType: "Anti-skid epoxy",
            hasVentilation: true,
            hasInsulation: true,
        },
        audio: {
            durationInSeconds: 5,
            transcript: "The warehouse features 12-meter clear height with anti-skid epoxy flooring.",
        },
    },
    internalDockSection: {
        videoUrl: "",
        imageUrl: "",
        audio: {
            durationInSeconds: 5,
            transcript: "Internal docking facilities for efficient loading operations.",
        },
    },
    internalUtilitiesSection: {
        videoUrl: "",
        imageUrl: "",
        featuresPresent: [
            "security_room",
            "canteen",
            "washrooms",
            "fire_pump_room",
        ],
        audio: {
            durationInSeconds: 5,
            transcript: "Complete with security room, canteen, washrooms, and fire safety systems.",
        },
    },
    dockingSection: {
        dockPanVideoUrl: "",
        imageUrl: "",
        audio: {
            durationInSeconds: 10,
            transcript: "Multiple docking bays equipped for simultaneous loading and unloading operations.",
        },
    },
    complianceSection: {
        fireSafetyVideoUrl: "",
        imageUrl: "",
        safetyFeatures: [
            "hydrants",
            "sprinklers",
            "alarm_system",
            "smoke_detectors",
        ],
        audio: {
            durationInSeconds: 10,
            transcript: "Fully compliant with all safety regulations and fire safety standards.",
        },
    },
    cadFileSection: {
        imageUrl: "",
        annotations: [],
    },
    sectionOrder: [...SECTION_KEYS],
};

export default function Editor() {
    return (
        <PageErrorBoundary pageName="Editor">
            <EditorContent />
        </PageErrorBoundary>
    );
}

function EditorContent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [pendingUploads, setPendingUploads] = useState<Map<string, File>>(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [showRenderConfirm, setShowRenderConfirm] = useState(false);
    const playerRef = useRef<PlayerRef>(null);
    const wasPlayingRef = useRef(false);
    const [isSavingForRender, setIsSavingForRender] = useState(false);
    const [triggerRender, setTriggerRender] = useState(false);

    // Initialize form with react-hook-form and zod validation
    const form = useForm<WarehouseVideoProps>({
        resolver: zodResolver(CompositionProps),
        defaultValues,
        mode: "onChange",
    });

    // Watch form values for rendering
    const formValues = useWatch({
        control: form.control,
    });

    // Use formValues if available, otherwise fallback to defaultValues
    const playerInputProps: WarehouseVideoProps = (formValues as WarehouseVideoProps) || defaultValues;

    // Initialize rendering hook
    const { renderMedia, state: renderState, undo: undoRender } = useRendering(COMPOSITION_ID, playerInputProps);

    // Deferred render trigger: wait for React to re-render with updated form values
    useEffect(() => {
        if (triggerRender) {
            setTriggerRender(false);
            renderMedia();
        }
    }, [triggerRender, renderMedia]);

    // Auto-create a blank Layer 1 when a CAD image is uploaded and annotations are empty
    const cadImageUrl = useWatch({ control: form.control, name: "cadFileSection.imageUrl" });
    const cadAnnotations = useWatch({ control: form.control, name: "cadFileSection.annotations" });
    useEffect(() => {
        if (cadImageUrl && cadImageUrl.trim() !== "" && (!cadAnnotations || cadAnnotations.length === 0)) {
            form.setValue("cadFileSection.annotations", [
                {
                    id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: "Layer 1",
                    drawingDataUrl: "",
                    color: "#ff0000",
                    order: 0,
                    audio: {
                        durationInSeconds: 3,
                        transcript: "",
                    },
                },
            ]);
        }
    }, [cadImageUrl]);

    // Watch audio durations to trigger validation of section durations
    const satDroneAudioDuration = useWatch({
        control: form.control,
        name: "satDroneSection.audio.durationInSeconds",
    });
    const locationAudioDuration = useWatch({
        control: form.control,
        name: "locationSection.audio.durationInSeconds",
    });
    const internalWideShotAudioDuration = useWatch({
        control: form.control,
        name: "internalWideShotSection.audio.durationInSeconds",
    });
    const internalDockAudioDuration = useWatch({
        control: form.control,
        name: "internalDockSection.audio.durationInSeconds",
    });
    const internalUtilitiesAudioDuration = useWatch({
        control: form.control,
        name: "internalUtilitiesSection.audio.durationInSeconds",
    });
    const dockingAudioDuration = useWatch({
        control: form.control,
        name: "dockingSection.audio.durationInSeconds",
    });
    const complianceAudioDuration = useWatch({
        control: form.control,
        name: "complianceSection.audio.durationInSeconds",
    });
    // Trigger validation when audio durations change
    useEffect(() => {
        // Revalidate section duration fields when audio duration changes
        const fields = [
            "satDroneSection.sectionDurationInSeconds",
            "locationSection.sectionDurationInSeconds",
            "internalWideShotSection.sectionDurationInSeconds",
            "internalDockSection.sectionDurationInSeconds",
            "internalUtilitiesSection.sectionDurationInSeconds",
            "dockingSection.sectionDurationInSeconds",
            "complianceSection.sectionDurationInSeconds",
        ] as const;

        fields.forEach(field => {
            const value = form.getValues(field);
            if (value !== undefined) {
                form.trigger(field);
            }
        });
    }, [satDroneAudioDuration, locationAudioDuration, internalWideShotAudioDuration,
        internalDockAudioDuration, internalUtilitiesAudioDuration, dockingAudioDuration, complianceAudioDuration, form]);

    // Load project data on mount
    useEffect(() => {
        const loadProject = async () => {
            if (!id) {
                setLoadError("No project ID provided");
                setIsLoading(false);
                showError("Invalid project", "No project ID provided");
                return;
            }

            try {
                setIsLoading(true);
                setLoadError(null);
                const composition = await getComposition(id);

                console.log('Loaded composition:', composition);
                console.log('Sat Drone audio:', composition.composition_components.satDroneSection?.audio);

                // Migrate old internalSection structure to new 3-section structure
                let compositionData = composition.composition_components;

                // Migrate old approach road structure
                if (compositionData.locationSection &&
                    (compositionData.locationSection as any).approachRoadVideoUrl !== undefined &&
                    !compositionData.approachRoadSection) {
                    const oldLocation = compositionData.locationSection as any;
                    compositionData = {
                        ...compositionData,
                        locationSection: {
                            nearbyPoints: oldLocation.nearbyPoints || [],
                            satelliteImageUrl: oldLocation.satelliteImageUrl,
                            audio: oldLocation.audio || {
                                audioUrl: "",
                                durationInSeconds: 5,
                                transcript: "",
                            },
                        },
                        approachRoadSection: {
                            videoUrl: oldLocation.approachRoadVideoUrl || "",
                            imageUrl: "",
                            audio: {
                                audioUrl: "",
                                durationInSeconds: 5,
                                transcript: "",
                            },
                        },
                    };
                }

                // Ensure approachRoadSection exists
                if (!compositionData.approachRoadSection) {
                    compositionData = {
                        ...compositionData,
                        approachRoadSection: {
                            videoUrl: "",
                            imageUrl: "",
                            audio: {
                                audioUrl: "",
                                durationInSeconds: 5,
                                transcript: "",
                            },
                        },
                    };
                }

                if ((compositionData as any).internalSection && !compositionData.internalWideShotSection) {
                    // Old structure detected - migrate to new structure
                    const oldInternal = (compositionData as any).internalSection;
                    compositionData = {
                        ...compositionData,
                        internalWideShotSection: {
                            videoUrl: oldInternal.wideShotVideoUrl || "",
                            imageUrl: "",
                            specs: oldInternal.specs || {
                                clearHeight: "",
                                flooringType: "",
                                hasVentilation: false,
                                hasInsulation: false,
                            },
                            audio: {
                                audioUrl: oldInternal.audio?.audioUrl || "",
                                durationInSeconds: oldInternal.audio?.durationInSeconds || 5,
                                transcript: oldInternal.audio?.transcript || "",
                            },
                        },
                        internalDockSection: {
                            videoUrl: oldInternal.internalDockVideoUrl || "",
                            imageUrl: "",
                            audio: {
                                audioUrl: "",
                                durationInSeconds: 5,
                                transcript: "",
                            },
                        },
                        internalUtilitiesSection: {
                            videoUrl: oldInternal.utilities?.videoUrl || "",
                            imageUrl: "",
                            featuresPresent: oldInternal.utilities?.featuresPresent || [],
                            audio: {
                                audioUrl: "",
                                durationInSeconds: 5,
                                transcript: "",
                            },
                        },
                    };
                    // Remove old internalSection
                    delete (compositionData as any).internalSection;
                }

                // Ensure cadFileSection exists (for old projects)
                if (!compositionData.cadFileSection) {
                    compositionData = {
                        ...compositionData,
                        cadFileSection: {
                            imageUrl: "",
                            annotations: [],
                        },
                    };
                } else {
                    // Migrate old cadFileSection: strip top-level audio & sectionDurationInSeconds
                    const cad = compositionData.cadFileSection as any;
                    if (cad.audio) delete cad.audio;
                    if (cad.sectionDurationInSeconds) delete cad.sectionDurationInSeconds;

                    // Migrate old annotation layers that used durationInSeconds instead of audio
                    if (Array.isArray(cad.annotations)) {
                        cad.annotations = cad.annotations.map((layer: any) => {
                            if (!layer.audio) {
                                const oldDuration = layer.durationInSeconds || 3;
                                return {
                                    ...layer,
                                    audio: {
                                        durationInSeconds: oldDuration,
                                        transcript: "",
                                    },
                                };
                            }
                            return layer;
                        });
                        // Clean up old durationInSeconds field
                        cad.annotations = cad.annotations.map((layer: any) => {
                            const { durationInSeconds, ...rest } = layer;
                            return rest;
                        });
                    }
                }

                // Ensure sectionOrder exists (for old projects)
                if (!compositionData.sectionOrder || !Array.isArray(compositionData.sectionOrder) || compositionData.sectionOrder.length === 0) {
                    compositionData = {
                        ...compositionData,
                        sectionOrder: [...SECTION_KEYS],
                    };
                }

                // Reset form with fetched data
                form.reset(compositionData);
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to load project:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to load project";
                setLoadError(errorMessage);
                showError("Failed to load project", errorMessage);
                setIsLoading(false);
            }
        };

        loadProject();
    }, [id, form, showError]);

    // Handle file selection for pending uploads
    const handleFileSelect = (fieldPath: string, file: File | null) => {
        setPendingUploads(prev => {
            const newMap = new Map(prev);
            if (file) {
                newMap.set(fieldPath, file);
            } else {
                newMap.delete(fieldPath);
            }
            return newMap;
        });
    };

    // Handle satellite image generation from Google Maps URL
    const handleSatelliteImageConfirm = async (googleMapsUrl: string) => {
        if (!id) {
            throw new Error("No project ID available");
        }

        try {
            const { generateSatelliteImage } = await import("~/lib/api");
            const result = await generateSatelliteImage(id, googleMapsUrl);

            // Update the form with the new satellite image URL
            form.setValue("satDroneSection.satelliteImageUrl", result.imageUrl);

            showSuccess("Satellite image generated", "The satellite image has been generated and saved");
        } catch (error) {
            console.error("Failed to generate satellite image:", error);
            throw error;
        }
    };

    // Handle TTS audio generation from transcript
    const handleGenerateSpeech = async (transcript: string, fieldPath: string) => {
        if (!id) {
            showError("Generation failed", "No project ID available");
            throw new Error("No project ID available");
        }

        if (!transcript || transcript.trim().length === 0) {
            showError("Generation failed", "Transcript text is required");
            throw new Error("Transcript text is required");
        }

        try {
            setIsGeneratingAudio(true);

            // Call TTS API
            const result = await generateAudioFromText(id, [
                {
                    text: transcript,
                    fieldPath,
                }
            ]);

            if (!result.success || result.audioFiles.length === 0) {
                throw new Error("Failed to generate audio");
            }

            const audioFile = result.audioFiles[0];

            // Update form with audio URL and duration
            // Extract the base path (e.g., "satDroneSection.audio" from "satDroneSection.audio.transcript")
            const pathParts = fieldPath.split('.');
            const audioUrlPath = [...pathParts.slice(0, -1), 'audioUrl'].join('.');
            const durationPath = [...pathParts.slice(0, -1), 'durationInSeconds'].join('.');

            form.setValue(audioUrlPath as any, audioFile.audioUrl);
            form.setValue(durationPath as any, audioFile.durationInSeconds);

            // Show success notification
            showSuccess("Speech generated", `Audio generated successfully (${audioFile.durationInSeconds.toFixed(1)}s)`);

            setIsGeneratingAudio(false);
        } catch (error) {
            console.error("Failed to generate speech:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to generate speech";
            showError("Generation failed", errorMessage);
            setIsGeneratingAudio(false);
            throw error;
        }
    };

    // Handle warehouse data fetched callback
    const handleWarehouseDataFetched = (warehouseData: any) => {
        console.log("Warehouse data received:", warehouseData);

        // Populate location name with "City, State"
        const { city, state, googleLocation } = warehouseData;
        if (city && state) {
            const locationName = `${city}, ${state}`;
            form.setValue('intro.projectLocationName', locationName);
            console.log(`Updated location name: ${locationName}`);
        }

        // If Google Maps URL is available, use it to populate the location field
        if (googleLocation && googleLocation.trim() !== '') {
            // Extract lat/lng from Google Maps URL
            const extractLatLngFromMapsUrl = (url: string): { lat: number; lng: number } | null => {
                if (!url) return null;
                
                // Format 1: https://www.google.com/maps/@28.4744,77.5040,15z
                const atFormat = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                if (atFormat) {
                    return {
                        lat: parseFloat(atFormat[1]),
                        lng: parseFloat(atFormat[2]),
                    };
                }
                
                // Format 2: https://www.google.com/maps/place/.../@28.4744,77.5040
                const placeFormat = url.match(/place\/[^\/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                if (placeFormat) {
                    return {
                        lat: parseFloat(placeFormat[1]),
                        lng: parseFloat(placeFormat[2]),
                    };
                }
                
                return null;
            };

            const coords = extractLatLngFromMapsUrl(googleLocation);
            if (coords) {
                form.setValue('satDroneSection.location', coords);
                console.log(`Updated location from Google Maps URL: lat=${coords.lat}, lng=${coords.lng}`);
                showSuccess("Warehouse data loaded", "Location name and coordinates have been populated successfully");
            } else {
                showWarning("Invalid Google Maps URL", "Could not extract coordinates from the Google Maps URL");
            }
        } else if (warehouseData.WarehouseData) {
            // Fallback: Use lat/lng from WarehouseData if Google Maps URL is not available
            const { latitude, longitude } = warehouseData.WarehouseData;
            
            if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
                form.setValue('satDroneSection.location', { lat: latitude, lng: longitude });
                console.log(`Updated location from coordinates: lat=${latitude}, lng=${longitude}`);
                showSuccess("Warehouse data loaded", "Location name and coordinates have been populated successfully");
            } else {
                showWarning("Coordinates missing", "Warehouse data loaded but coordinates are missing");
            }
        } else {
            showWarning("Location data unavailable", "Warehouse found but location data is not available");
        }
    };

    // Handle warehouse fetch error callback
    const handleWarehouseFetchError = (error: string) => {
        console.error("Warehouse fetch error:", error);
        showError("Failed to fetch warehouse", error);
    };

    // Handle save project with media uploads
    const handleSaveProject = async () => {
        if (!id) {
            showError("Save failed", "No project ID available");
            return;
        }

        // Validate form before saving
        const isValid = await form.trigger();
        if (!isValid) {
            showError("Validation failed", "Please fix the validation errors before saving");
            return;
        }

        try {
            setIsSaving(true);

            // Get current form data
            const formData = form.getValues();

            // If there are pending uploads, handle them first
            if (pendingUploads.size > 0) {
                showWarning("Uploading files", `Uploading ${pendingUploads.size} file(s)...`);

                // Prepare upload requests
                const uploadRequests: UploadRequest[] = Array.from(pendingUploads.entries()).map(([fieldPath, file]) => {
                    // Determine media type from field name
                    let mediaType: 'video' | 'audio' | 'image' = 'video';
                    if (fieldPath.toLowerCase().includes('audio')) {
                        mediaType = 'audio';
                    } else if (fieldPath.toLowerCase().includes('image')) {
                        mediaType = 'image';
                    }

                    return {
                        file,
                        compositionId: id,
                        fieldPath,
                        mediaType,
                    };
                });

                // Upload all files in parallel
                const uploadResults = await uploadBatch(uploadRequests);

                // Check for failures
                const failures = uploadResults.filter(result => !result.success);
                if (failures.length > 0) {
                    const errorMessages = failures.map(f => `${f.fieldPath}: ${f.error}`).join('\n');
                    throw new Error(`Some uploads failed:\n${errorMessages}`);
                }

                // Build URL mappings and merge into form data
                uploadResults.forEach(result => {
                    if (result.success && result.publicUrl) {
                        // Set the value in the form data using the field path
                        const pathParts = result.fieldPath.split('.');
                        let current: any = formData;

                        // Navigate to the parent object
                        for (let i = 0; i < pathParts.length - 1; i++) {
                            if (!current[pathParts[i]]) {
                                current[pathParts[i]] = {};
                            }
                            current = current[pathParts[i]];
                        }

                        // Set the final value
                        current[pathParts[pathParts.length - 1]] = result.publicUrl;
                    }
                });

                // Clear pending uploads after successful upload
                setPendingUploads(new Map());
            }

            // Update composition with merged data
            await updateComposition(id, formData);

            // Show success notification
            showSuccess("Project saved", "Your changes have been saved successfully");

            setIsSaving(false);
        } catch (error) {
            console.error("Failed to save project:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to save project";
            showError("Save failed", errorMessage);
            setIsSaving(false);
        }
    };

    // Handle render with auto-save
    const handleRenderClick = () => {
        setShowRenderConfirm(true);
    };

    const handleRenderConfirm = async () => {
        setShowRenderConfirm(false);
        try {
            setIsSavingForRender(true);

            // Validate form
            const isValid = await form.trigger();
            if (!isValid) {
                showError("Validation failed", "Please fix the validation errors before rendering");
                setIsSavingForRender(false);
                return;
            }

            // Get current form data
            const formData = form.getValues();

            // Upload pending files if any
            if (pendingUploads.size > 0) {
                showWarning("Uploading files", `Uploading ${pendingUploads.size} file(s) before render...`);

                const uploadRequests: UploadRequest[] = Array.from(pendingUploads.entries()).map(([fieldPath, file]) => {
                    let mediaType: 'video' | 'audio' | 'image' = 'video';
                    if (fieldPath.toLowerCase().includes('audio')) {
                        mediaType = 'audio';
                    } else if (fieldPath.toLowerCase().includes('image')) {
                        mediaType = 'image';
                    }
                    return { file, compositionId: id!, fieldPath, mediaType };
                });

                const uploadResults = await uploadBatch(uploadRequests);
                const failures = uploadResults.filter(result => !result.success);
                if (failures.length > 0) {
                    const errorMessages = failures.map(f => `${f.fieldPath}: ${f.error}`).join('\n');
                    showError("Upload failed", errorMessages);
                    setIsSavingForRender(false);
                    return;
                }

                // Replace blob URLs with real R2 URLs in form data
                uploadResults.forEach(result => {
                    if (result.success && result.publicUrl) {
                        const pathParts = result.fieldPath.split('.');
                        let current: any = formData;
                        for (let i = 0; i < pathParts.length - 1; i++) {
                            if (!current[pathParts[i]]) current[pathParts[i]] = {};
                            current = current[pathParts[i]];
                        }
                        current[pathParts[pathParts.length - 1]] = result.publicUrl;
                    }
                });

                // Update form with real URLs so the render uses them
                form.reset(formData);
                setPendingUploads(new Map());
            }

            // Save composition
            await updateComposition(id!, formData);
            showSuccess("Project saved", "Starting render...");
            setIsSavingForRender(false);

            // Trigger render on next React render cycle (after form values update)
            setTriggerRender(true);
        } catch (error) {
            console.error("Failed to save before render:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to save project";
            showError("Save failed", errorMessage);
            setIsSavingForRender(false);
        }
    };

    // Watch form values for real-time preview
    // (Already defined above for rendering hook)

    // Calculate dynamic video duration based on audio durations with padding
    const calculateDuration = (props: WarehouseVideoProps): number => {
        const fps = COMPOSITION_FPS;
        const TRANSITION_DURATION = 10; // Must match Main.tsx (0.33s overlap between sections)
        const introDuration = 5 * fps;
        const outroDuration = 5 * fps;

        // Collect non-zero section durations
        const sectionKeys: string[] = ['satDroneSection', 'locationSection', 'approachRoadSection',
            'internalWideShotSection', 'internalDockSection',
            'internalUtilitiesSection', 'dockingSection', 'complianceSection'];

        const sectionDurations: number[] = [];
        for (const key of sectionKeys) {
            const section = (props as any)[key];
            if (section?.audio) {
                const calc = calculateSectionDuration(
                    section.audio.durationInSeconds || 0,
                    section.sectionDurationInSeconds
                );
                const dur = calc.actualDuration * fps;
                if (dur > 0) sectionDurations.push(dur);
            }
        }

        // CAD section: duration = sum of annotation layer padded durations
        const cadAnnotations = props.cadFileSection?.annotations || [];
        const cadTotalPaddedDuration = cadAnnotations.reduce(
            (sum, layer, index) => {
                const layerDur = (layer.audio?.durationInSeconds || 0) + 1.0;
                return sum + layerDur - (index > 0 ? 0.5 : 0);
            }, 0
        );
        if (cadTotalPaddedDuration > 0) {
            const cadCalc = calculateSectionDuration(Math.max(cadTotalPaddedDuration - 1.0, 0));
            const cadDur = cadCalc.actualDuration * fps;
            if (cadDur > 0) sectionDurations.push(cadDur);
        }

        // Total section frames
        const totalSectionDuration = sectionDurations.reduce((a, b) => a + b, 0);

        // Subtract transition overlaps: one between each pair of adjacent items
        // (intro→section, section→section, section→outro)
        const numTransitions = sectionDurations.length > 0
            ? sectionDurations.length + 1  // intro→first + between sections + last→outro
            : 0;
        const transitionOverlap = numTransitions * TRANSITION_DURATION;

        return introDuration + totalSectionDuration + outroDuration - transitionOverlap;
    };

    const videoDuration = calculateDuration(playerInputProps);

    // Show loading state while fetching project
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading project...</p>
                </div>
            </div>
        );
    }

    // Show error state if project failed to load
    if (loadError) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Project</h2>
                    <p className="text-gray-600 mb-6">{loadError}</p>
                    <Button onClick={() => navigate('/')}>
                        ← Back to Projects
                    </Button>
                </div>
            </div>
        );
    }

    // Split-Screen Editor View
    return (
        <div className="h-screen overflow-hidden bg-gray-50">
            {/* Loading Overlay for TTS Generation */}
            {isGeneratingAudio && (
                <LoadingOverlay message="Generating speech..." />
            )}

            {/* Render Confirmation Modal */}
            {showRenderConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
                                    <span className="text-xl">🎬</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Save & Render Video
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Your project will be saved before rendering to ensure all media files are uploaded and accessible.
                            </p>
                            {pendingUploads.size > 0 && (
                                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <span className="text-amber-600 text-sm">⚠️</span>
                                    <span className="text-xs font-medium text-amber-700">
                                        {pendingUploads.size} file{pendingUploads.size !== 1 ? 's' : ''} will be uploaded to cloud storage
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowRenderConfirm(false)}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleRenderConfirm}
                                className="px-6 bg-purple-600 hover:bg-purple-700"
                            >
                                Save & Render
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 w-full">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <img src="/WOG_logo.png" alt="WareOnGo Logo" className="h-10 w-auto" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">WareOnGo</h1>
                            <p className="text-xs text-gray-500">Video Editor Studio</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {pendingUploads.size > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
                                <span className="text-xs font-medium text-blue-700">
                                    {pendingUploads.size} file{pendingUploads.size !== 1 ? 's' : ''} pending
                                </span>
                            </div>
                        )}

                        {/* Render Status Display */}
                        {renderState.status === "rendering" && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-md">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                                <span className="text-xs font-medium text-purple-700">
                                    Rendering: {Math.round(renderState.progress * 100)}%
                                </span>
                            </div>
                        )}

                        {renderState.status === "done" && (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(renderState.url);
                                            const blob = await response.blob();
                                            const blobUrl = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = blobUrl;
                                            a.download = 'warehouse-video.mp4';
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(blobUrl);
                                        } catch (error) {
                                            console.error('Download failed:', error);
                                            window.open(renderState.url, '_blank');
                                        }
                                    }}
                                    className="px-4 bg-green-600 hover:bg-green-700"
                                >
                                    Download Video
                                </Button>
                                <Button
                                    type="button"
                                    onClick={undoRender}
                                    variant="secondary"
                                    className="text-sm"
                                >
                                    Render Again
                                </Button>
                            </div>
                        )}

                        {renderState.status === "error" && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md max-w-md">
                                <span className="text-xs font-medium text-red-700 truncate" title={renderState.error?.message}>
                                    Render failed: {renderState.error?.message || "Unknown error"}
                                </span>
                                <Button
                                    type="button"
                                    onClick={undoRender}
                                    variant="secondary"
                                    className="text-xs py-1 px-2 shrink-0"
                                >
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {/* Render Button */}
                        {(renderState.status === "init" || renderState.status === "invoking") && (
                            <Button
                                type="button"
                                onClick={handleRenderClick}
                                disabled={renderState.status === "invoking" || isSavingForRender}
                                className="px-6 bg-purple-600 hover:bg-purple-700"
                            >
                                {isSavingForRender ? "Saving..." : renderState.status === "invoking" ? "Starting..." : "🎬 Render Video"}
                            </Button>
                        )}

                        <Button
                            type="button"
                            onClick={handleSaveProject}
                            disabled={isSaving}
                            className="px-6"
                        >
                            {isSaving ? "Saving..." : "Save Project"}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => navigate('/')}
                            variant="secondary"
                        >
                            ← Back to Projects
                        </Button>
                    </div>
                </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-0 h-[calc(100vh-73px)] overflow-hidden">
                {/* Left Panel: Remotion Player */}
                <div className="bg-gray-50 flex items-center justify-center p-4 overflow-hidden border-r-2 border-black">
                    <div className="w-full max-w-full">
                        <Player
                            ref={playerRef}
                            component={Main}
                            inputProps={playerInputProps}
                            durationInFrames={videoDuration}
                            fps={COMPOSITION_FPS}
                            compositionHeight={COMPOSITION_HEIGHT}
                            compositionWidth={COMPOSITION_WIDTH}
                            style={{
                                width: "100%",
                                maxHeight: "calc(100vh - 150px)",
                            }}
                            controls
                            loop
                            renderLoading={() => null}
                            errorFallback={() => null}
                        />
                    </div>
                </div>

                {/* Right Panel: Editable Form */}
                <div className="bg-white overflow-y-auto overflow-x-hidden p-6">
                    <div className="max-w-3xl mx-auto">
                        <Form {...form}>
                            <form className="space-y-6">
                                <WarehouseDataFetcher
                                    onDataFetched={handleWarehouseDataFetched}
                                    onError={handleWarehouseFetchError}
                                    disabled={isSaving || isGeneratingAudio}
                                />
                                <SchemaFormGenerator
                                    schema={CompositionProps}
                                    form={form}
                                    onFileSelect={handleFileSelect}
                                    compositionId={id}
                                    onSatelliteImageConfirm={handleSatelliteImageConfirm}
                                    onGenerateSpeech={handleGenerateSpeech}
                                    isGeneratingAudio={isGeneratingAudio}
                                    sectionOrder={form.watch('sectionOrder') || [...SECTION_KEYS]}
                                    onSectionOrderChange={(newOrder) => form.setValue('sectionOrder', newOrder)}
                                    onDraggingChange={(isDragging) => {
                                        if (isDragging) {
                                            // Remember if playing, then pause
                                            const playing = playerRef.current?.isPlaying() ?? false;
                                            wasPlayingRef.current = playing;
                                            if (playing) playerRef.current?.pause();
                                        } else {
                                            // Resume if it was playing before drag
                                            if (wasPlayingRef.current) playerRef.current?.play();
                                        }
                                    }}
                                />
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}
