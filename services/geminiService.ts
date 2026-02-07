
import { createWorker } from 'tesseract.js';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, ImageInput } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Image Resizer (To prevent 413 Payload Too Large or Timeouts) ---
const resizeImage = async (base64: string, mimeType: string, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = `data:${mimeType};base64,${base64}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL(mimeType, 0.8); // 80% quality
            resolve(dataUrl.split(',')[1]);
        };
    });
};

// --- Helper: Improved Retry Logic with specific error detection ---
const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries: number = 5,
    delay: number = 3000 
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        const errorMessage = error?.message?.toLowerCase() || "";
        const isRateLimit = errorMessage.includes('429') || errorMessage.includes('quota');
        const isServerBusy = errorMessage.includes('500') || errorMessage.includes('503') || errorMessage.includes('overloaded');

        if (retries > 0 && (isRateLimit || isServerBusy)) {
            const nextDelay = isRateLimit ? delay * 2 : delay; // Wait longer for rate limits
            console.warn(`API Busy/Limit reached. Retrying in ${nextDelay/1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, nextDelay));
            return retryWithBackoff(operation, retries - 1, nextDelay);
        }
        
        // If it's a specific quota error, throw a friendly message
        if (isRateLimit) {
            throw new Error("API Quota Exceeded. Please wait a minute before trying again.");
        }
        throw error;
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const worker = await createWorker('eng');
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    const ret = await worker.recognize(imageUrl);
    await worker.terminate();
    return ret.data.text || "No text found.";
  } catch (error) {
    console.error("OCR Error:", error);
    return "Error extracting text.";
  }
};

export const generateStudyPlan = async (subject: string, topic: string): Promise<string> => {
    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a concise, 3-bullet point study strategy for: Subject: ${subject}, Topic: ${topic}. Bengali language.`
        })) as GenerateContentResponse;
        return response.text || "No plan generated.";
    } catch (error) {
        return "1. Review concepts.\n2. Solve problems.\n3. Take rest.";
    }
}

const prepareImages = async (images: ImageInput[]) => {
    const processed = await Promise.all(images.map(async img => ({
        inlineData: {
            data: await resizeImage(img.base64, img.mimeType),
            mimeType: img.mimeType
        }
    })));
    return processed;
};

export const analyzeChapter = async (images: ImageInput[]) => {
  const imageParts = await prepareImages(images);
  const prompt = `Act as an expert teacher. Analyze these textbook pages. Provide: 1. Summary, 2. 10 Questions, 3. Key Topics. Language: BENGALI. Return JSON format with keys: summary, questions, topics.`;

  const response = await retryWithBackoff(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [...imageParts, { text: prompt }] },
    config: { responseMimeType: 'application/json' }
  })) as GenerateContentResponse;
  
  return JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate to ${targetLanguage}: ${text}`
    })) as GenerateContentResponse;
    return response.text || "Failed to translate.";
};

export const generateQuiz = async (images: ImageInput[]): Promise<QuizQuestion[]> => {
    const imageParts = await prepareImages(images);
    const prompt = `Generate 15-20 MCQs in BENGALI from these pages. Return JSON array of objects with keys: question, options (array of 4), correctAnswer (index), explanation.`;

    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: { responseMimeType: 'application/json' }
    })) as GenerateContentResponse;

    return JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
};

export const askTutor = async (images: ImageInput[], history: any[], question: string): Promise<string> => {
    const imageParts = await prepareImages(images);
    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts, { text: `Tutor session. Question: ${question}` }] }
    })) as GenerateContentResponse;
    return response.text || "I'm not sure about that.";
};
