import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Sarvam AI SDK - using require as package may not have TypeScript definitions
const { SarvamAIClient } = require('sarvamai');

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export interface SarvamTTSRequest {
    text: string;
    fieldPath: string;
    voice?: string; // Sarvam voice ID (e.g., 'rohan', 'anushka', 'abhilash', 'manisha', etc.)
    language?: string; // Language code (e.g., 'hi-IN', 'en-IN')
    speed?: number; // Speech pace (0.5 to 2.0)
    sampleRate?: number; // 8000, 16000, 22050, 24000, 48000
}

export interface SarvamTTSResult {
    fieldPath: string;
    audioUrl: string;
    key: string;
    durationInSeconds: number;
}

/**
 * Calculate audio duration from text
 * Sarvam AI speaks at approximately 150-170 words per minute
 */
function estimateDuration(text: string, pace: number = 1.1): number {
    const wordCount = text.split(/\s+/).length;
    const baseWPM = 160; // Words per minute
    const adjustedWPM = baseWPM * pace;
    const durationInSeconds = Math.max(1, Math.ceil((wordCount / adjustedWPM) * 60));
    return durationInSeconds;
}

export const generateAudioFromTextSarvam = async (
    compositionId: string,
    requests: SarvamTTSRequest[]
): Promise<SarvamTTSResult[]> => {
    const results: SarvamTTSResult[] = [];

    if (!process.env.SARVAM_API_KEY) {
        throw new Error('SARVAM_API_KEY is not configured');
    }

    // Initialize Sarvam AI client
    const client = new SarvamAIClient({
        apiSubscriptionKey: process.env.SARVAM_API_KEY,
    });

    for (const request of requests) {
        const {
            text,
            fieldPath,
            voice = 'shubh', // Default to 'rohan' - valid Sarvam AI voice
            language = 'en-IN',
            speed = 1, // Default to 1.1x speed for better pacing
            sampleRate = 48000
        } = request;

        // Call Sarvam AI Bulbul V3 API using official SDK
        const response = await client.textToSpeech.convert({
            text: text, // Use original text without enhancement
            target_language_code: language,
            speaker: voice,
            pace: speed,
            speech_sample_rate: sampleRate,
            enable_preprocessing: true,
            model: 'bulbul:v3',
        });

        if (!response || !response.audios || response.audios.length === 0) {
            throw new Error('No audio generated from Sarvam AI');
        }

        // The audio is returned as base64 encoded string
        const audioBase64 = response.audios[0];
        const buffer = Buffer.from(audioBase64, 'base64');

        // Generate unique key
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const key = `compositions/${compositionId}/audio/${timestamp}-${randomString}.mp3`;

        // Upload to R2
        await r2Client.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME!,
                Key: key,
                Body: buffer,
                ContentType: 'audio/mpeg',
            })
        );

        const audioUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        // Calculate duration estimate
        const durationInSeconds = estimateDuration(text, speed);

        results.push({
            fieldPath,
            audioUrl,
            key,
            durationInSeconds,
        });
    }

    return results;
};
