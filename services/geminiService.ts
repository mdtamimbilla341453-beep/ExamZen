import { createWorker } from 'tesseract.js';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, ImageInput } from '../types';

// Use gemini-3-flash-preview as the core model
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Robust AI instance generator. 
 * process.env.API_KEY is replaced during build time by Vite.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.error("Critical: API Key is missing. Ensure VITE_API_KEY is set in your environment.");
    throw new Error("API Key is missing. Please check your configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Helper: Image Resizer ---
const resizeImage = async (base64: string, mimeType: string, maxWidth = 800): Promise<string> => {
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
            const dataUrl = canvas.toDataURL(mimeType, 0.6); 
            resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => resolve(base64);
    });
};

// --- Helper: Retry Logic ---
const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries: number = 2,
    delay: number = 3000 
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        const errorMessage = error?.message?.toLowerCase() || "";
        
        if (retries > 0 && (errorMessage.includes('429') || errorMessage.includes('500') || errorMessage.includes('overloaded') || errorMessage.includes('quota'))) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryWithBackoff(operation, retries - 1, delay * 2);
        }
        
        if (errorMessage.includes('429') || errorMessage.includes('quota')) {
            throw new Error("এপিআই লিমিট শেষ হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
        }
        if (errorMessage.includes('key') && (errorMessage.includes('invalid') || errorMessage.includes('403'))) {
            throw new Error("আপনার এপিআই কী (API Key) সঠিক নয়।");
        }
        
        throw new Error("সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে। আবার চেষ্টা করুন।");
    }
};

const prepareImages = async (images: ImageInput[]) => {
    return await Promise.all(images.map(async img => ({
        inlineData: {
            data: await resizeImage(img.base64, img.mimeType),
            mimeType: img.mimeType
        }
    })));
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const worker = await createWorker('eng+ben');
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    const ret = await worker.recognize(imageUrl);
    await worker.terminate();
    return ret.data.text || "No text found.";
  } catch (error) {
    console.error("OCR Error:", error);
    return "টেক্সট পড়া সম্ভব হয়নি।";
  }
};

export const generateStudyPlan = async (subject: string, topic: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Create a concise, 3-bullet point study strategy for: Subject: ${subject}, Topic: ${topic}. Language: BENGALI.`
        })) as GenerateContentResponse;
        return response.text || "প্ল্যান তৈরি করা যায়নি।";
    } catch (error) {
        return "১. মূল ধারণাগুলো পড়ুন।\n২. নোট তৈরি করুন।\n৩. নিয়মিত প্র্যাকটিস করুন।";
    }
}

export const analyzeChapter = async (images: ImageInput[]) => {
  const ai = getAI();
  const imageParts = await prepareImages(images);
  const prompt = `Act as an expert teacher. Analyze these textbook pages. Provide: 1. Summary, 2. 10 Questions, 3. Key Topics. Language: BENGALI. Return JSON format with keys: summary, questions, topics.`;

  const response = await retryWithBackoff(() => ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: [...imageParts, { text: prompt }] },
    config: { responseMimeType: 'application/json' }
  })) as GenerateContentResponse;
  
  const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const ai = getAI();
    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Translate the following text to ${targetLanguage}. Keep the tone academic. Text: ${text}`
    })) as GenerateContentResponse;
    return response.text || "অনুবাদ করা যায়নি।";
};

export const generateQuiz = async (images: ImageInput[]): Promise<QuizQuestion[]> => {
    const ai = getAI();
    const imageParts = await prepareImages(images);
    const prompt = `Generate 15 Multiple Choice Questions (MCQs) in BENGALI from these textbook pages. Return a JSON array of objects. Each object must have: "question" (string), "options" (array of 4 strings), "correctAnswer" (integer 0-3), and "explanation" (string).`;

    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [...imageParts, { text: prompt }] },
        config: { responseMimeType: 'application/json' }
    })) as GenerateContentResponse;

    const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
};

export const askTutor = async (images: ImageInput[], history: any[], question: string): Promise<string> => {
    const ai = getAI();
    const imageParts = await prepareImages(images);
    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [...imageParts, { text: `Tutor session. Answer in BENGALI based on these images. Previous question: ${question}` }] }
    })) as GenerateContentResponse;
    return response.text || "দুঃখিত, আমি উত্তরটি খুঁজে পাচ্ছি না।";
};