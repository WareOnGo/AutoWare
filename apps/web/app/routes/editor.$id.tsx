import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Player } from "@remotion/player";
import { useParams, useNavigate } from "react-router";
import type { Route } from "./+types/editor.$id";
import stylesheet from "~/app.css?url";
import {
    COMPOSITION_FPS,
    COMPOSITION_HEIGHT,
    COMPOSITION_WIDTH,
} from "~/remotion/constants.mjs";
import { CompositionProps, WarehouseVideoProps } from "@repo/shared";
import { Main } from "~/remotion/components/Main";
import { Form } from "~/components/ui/form";

import { Button } from "~/components/Button";
import { SchemaFormGenerator } from "~/components/SchemaFormGenerator";
import { PageErrorBoundary } from "~/components/PageErrorBoundary";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { getComposition, updateComposition, generateAudioFromText } from "~/lib/api";
import { uploadBatch, UploadRequest } from "~/lib/upload";
import { useToast } from "~/lib/toast-context";
import { calculateSectionDuration } from "~/lib/utils";

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

    // Initialize form with react-hook-form and zod validation
    const form = useForm<WarehouseVideoProps>({
        resolver: zodResolver(CompositionProps),
        defaultValues,
        mode: "onChange",
    });

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

    // Watch form values for real-time preview
    const formValues = useWatch({
        control: form.control,
    });

    // Use formValues if available, otherwise fallback to defaultValues
    const playerInputProps: WarehouseVideoProps = (formValues as WarehouseVideoProps) || defaultValues;

    // Calculate dynamic video duration based on audio durations with padding
    const calculateDuration = (props: WarehouseVideoProps): number => {
        const fps = COMPOSITION_FPS;
        const introDuration = 5 * fps;
        const outroDuration = 5 * fps;
        
        // Calculate each section duration using actual audio durations and padding
        const satDroneCalc = calculateSectionDuration(
            props.satDroneSection.audio.durationInSeconds || 0,
            props.satDroneSection.sectionDurationInSeconds
        );
        
        const locationCalc = calculateSectionDuration(
            props.locationSection.audio.durationInSeconds || 0,
            props.locationSection.sectionDurationInSeconds
        );
        
        const approachRoadCalc = calculateSectionDuration(
            props.approachRoadSection.audio.durationInSeconds || 0,
            props.approachRoadSection.sectionDurationInSeconds
        );
        
        // Three separate internal sections
        const internalWideShotCalc = calculateSectionDuration(
            props.internalWideShotSection.audio.durationInSeconds || 0,
            props.internalWideShotSection.sectionDurationInSeconds
        );
        const internalDockCalc = calculateSectionDuration(
            props.internalDockSection.audio.durationInSeconds || 0,
            props.internalDockSection.sectionDurationInSeconds
        );
        const internalUtilitiesCalc = calculateSectionDuration(
            props.internalUtilitiesSection.audio.durationInSeconds || 0,
            props.internalUtilitiesSection.sectionDurationInSeconds
        );
        
        const dockingCalc = calculateSectionDuration(
            props.dockingSection.audio.durationInSeconds || 0,
            props.dockingSection.sectionDurationInSeconds
        );
        const complianceCalc = calculateSectionDuration(
            props.complianceSection.audio.durationInSeconds || 0,
            props.complianceSection.sectionDurationInSeconds
        );
        
        // Use actual duration (which includes padding) for each section
        const satDroneDuration = satDroneCalc.actualDuration * fps;
        const locationDuration = locationCalc.actualDuration * fps;
        const approachRoadDuration = approachRoadCalc.actualDuration * fps;
        const internalWideShotDuration = internalWideShotCalc.actualDuration * fps;
        const internalDockDuration = internalDockCalc.actualDuration * fps;
        const internalUtilitiesDuration = internalUtilitiesCalc.actualDuration * fps;
        const dockingDuration = dockingCalc.actualDuration * fps;
        const complianceDuration = complianceCalc.actualDuration * fps;
        
        return introDuration + satDroneDuration + locationDuration + approachRoadDuration + 
               internalWideShotDuration + internalDockDuration + internalUtilitiesDuration + 
               dockingDuration + complianceDuration + outroDuration;
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
                                <SchemaFormGenerator
                                    schema={CompositionProps}
                                    form={form}
                                    onFileSelect={handleFileSelect}
                                    compositionId={id}
                                    onSatelliteImageConfirm={handleSatelliteImageConfirm}
                                    onGenerateSpeech={handleGenerateSpeech}
                                    isGeneratingAudio={isGeneratingAudio}
                                />
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}
