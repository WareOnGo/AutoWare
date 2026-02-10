import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Player } from "@remotion/player";
import type { Route } from "./+types/Editor";
import stylesheet from "~/app.css?url";
import {
    DURATION_IN_FRAMES,
    COMPOSITION_FPS,
    COMPOSITION_HEIGHT,
    COMPOSITION_WIDTH,
} from "~/remotion/constants.mjs";
import { CompositionProps, WarehouseVideoProps } from "@repo/shared";
import { Main } from "~/remotion/components/Main";
import { Form } from "~/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/Button";
import { SchemaFormGenerator } from "~/components/SchemaFormGenerator";

export const links: Route.LinksFunction = () => [
    { rel: "stylesheet", href: stylesheet },
];

// Default values for the warehouse video form - Complete sample data
const defaultValues: WarehouseVideoProps = {
    meta: {
        clientName: "Acme Logistics Inc.",
        projectLocationName: "Greater Noida Industrial Hub",
    },
    sectionSatDrone: {
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
    sectionLocation: {
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
    sectionInternal: {
        wideShotVideoUrl: "",
        specs: {
            clearHeight: "12 meters",
            flooringType: "Anti-skid epoxy",
            hasVentilation: true,
            hasInsulation: true,
        },
        internalDockVideoUrl: "",
        utilities: {
            videoUrl: "",
            featuresPresent: [
                "security_room",
                "canteen",
                "washrooms",
                "fire_pump_room",
            ],
        },
        audio: {
            durationInSeconds: 15,
            transcript: "The warehouse features 12-meter clear height with anti-skid epoxy flooring, complete with ventilation and insulation.",
        },
    },
    sectionDocking: {
        dockPanVideoUrl: "",
        audio: {
            durationInSeconds: 10,
            transcript: "Multiple docking bays equipped for simultaneous loading and unloading operations.",
        },
    },
    sectionCompliance: {
        fireSafetyVideoUrl: "",
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

// Helper function to generate TTS audio URLs from transcripts
// TODO: Replace with actual TTS API integration
function transformAudioToTTS(data: any): WarehouseVideoProps {
    const result = { ...data };

    // Generate placeholder TTS URLs for each section
    const sections = ['sectionSatDrone', 'sectionLocation', 'sectionInternal', 'sectionDocking', 'sectionCompliance'];

    sections.forEach(section => {
        if (result[section]?.audio) {
            // For now, use a placeholder. In production, this would call your TTS API
            const transcript = result[section].audio.transcript || "";
            result[section].audio.audioUrl = `https://tts-api.example.com/generate?text=${encodeURIComponent(transcript.substring(0, 50))}`;
        }
    });

    return result;
}

export default function Editor() {
    const [isPreviewing, setIsPreviewing] = useState(false);

    // Initialize form with react-hook-form and zod validation
    const form = useForm<WarehouseVideoProps>({
        resolver: zodResolver(CompositionProps),
        defaultValues,
        mode: "onChange",
    });

    // Watch form values for real-time preview
    const formValues = useWatch({
        control: form.control,
    });

    // Use formValues if available, otherwise fallback to defaultValues
    // Transform the data to add TTS audio URLs before passing to player
    const rawFormValues = formValues as WarehouseVideoProps || defaultValues;
    const playerInputProps: WarehouseVideoProps = transformAudioToTTS(rawFormValues);

    const onSubmit = async (data: WarehouseVideoProps) => {
        // Double-check that validation truly passed
        const errors = Object.keys(form.formState.errors);
        if (errors.length > 0) {
            console.error("❌ Form has errors, preventing submission:", form.formState.errors);
            return;
        }

        // Validation passed - switch to preview mode
        console.log("✅ Form submitted successfully - validation passed:", data);
        setIsPreviewing(true);
    };

    const onError = (errors: any) => {

        console.error("Form validation errors:", errors);

        // Collect all error messages
        const errorMessages: string[] = [];

        const collectErrors = (obj: any, prefix = '') => {
            Object.keys(obj).forEach(key => {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (obj[key]?.message) {
                    errorMessages.push(`• ${fullKey}: ${obj[key].message}`);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    collectErrors(obj[key], fullKey);
                }
            });
        };

        collectErrors(errors);

        // Show user-friendly alert
        const message = errorMessages.length > 0
            ? `Please fix the following errors:\n\n${errorMessages.join('\n')}`
            : 'Please fill in all required fields';

        window.alert(message);
    };

    // Mode 1: Onboarding View (Centered Card)
    if (!isPreviewing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-4xl">
                    <CardHeader>
                        <CardTitle>Create Your Warehouse Video</CardTitle>
                        <CardDescription>
                            Fill in the details below to generate your custom warehouse showcase video
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                                <div className="max-h-[60vh] overflow-y-auto pr-4">
                                    <SchemaFormGenerator
                                        schema={CompositionProps}
                                        form={form}
                                    />
                                </div>
                                <CardFooter className="px-0 pt-6">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-lg font-semibold"
                                    >
                                        Preview Video →
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Mode 2: Studio View (Split Screen)
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Video Editor Studio</h1>
                        <p className="text-sm text-gray-500">Edit your warehouse video in real-time</p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => setIsPreviewing(false)}
                        variant="secondary"
                    >
                        ← Back to Form
                    </Button>
                </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-0 h-[calc(100vh-73px)]">
                {/* Left Panel: Remotion Player */}
                <div className="bg-black flex items-center justify-center p-4 overflow-hidden">
                    <div className="w-full max-w-full">
                        <Player
                            component={Main}
                            inputProps={playerInputProps}
                            durationInFrames={DURATION_IN_FRAMES}
                            fps={COMPOSITION_FPS}
                            compositionHeight={COMPOSITION_HEIGHT}
                            compositionWidth={COMPOSITION_WIDTH}
                            style={{
                                width: "100%",
                                maxHeight: "calc(100vh - 150px)",
                            }}
                            controls
                            loop
                        />
                    </div>
                </div>

                {/* Right Panel: Editable Form */}
                <div className="bg-white overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto">
                        <Form {...form}>
                            <form className="space-y-6">
                                <SchemaFormGenerator
                                    schema={CompositionProps}
                                    form={form}
                                />
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}
