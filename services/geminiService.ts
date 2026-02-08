import { createWorker } from 'tesseract.js';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, ImageInput } from '../types';

/**
 * Gemini 1.5 Flash মডেল (gemini-flash-latest)
 */
const MODEL_NAME = 'gemini-flash-latest';

/**
 * এপিআই কী রিড করার জন্য হেল্পার
 */
const getApiKey = () => {
  const key = process.env.API_KEY || '';
  if (!key.trim()) {
    throw new Error("এপিআই কী পাওয়া যায়নি। অনুগ্রহ করে Netlify/Vercel এ VITE_API_KEY বা API_KEY এনভায়রনমেন্ট ভেরিয়েবল চেক করুন।");
  }
  return key.trim();
};

// --- Helper: Image Resizer for efficiency ---
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
            const dataUrl = canvas.toDataURL(mimeType, 0.7); 
            resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => resolve(base64);
    });
};

const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries: number = 2,
    delay: number = 2000 
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        console.error("Gemini Error:", error);
        const status = error?.status || 0;
        const msg = error?.message?.toLowerCase() || "";

        if (retries > 0 && (status === 429 || status === 500 || status === 503 || msg.includes('overloaded'))) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryWithBackoff(operation, retries - 1, delay * 2);
        }
        
        if (status === 403 || msg.includes('key') || msg.includes('invalid')) {
            throw new Error("আপনার এপিআই কী সঠিক নয়। অনুগ্রহ করে আপনার API Key চেক করুন।");
        }
        
        throw new Error("সার্ভারের সাথে সংযোগ করতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।");
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
    return ret.data.text || "টেক্সট পাওয়া যায়নি।";
  } catch (error) {
    console.error("OCR Error:", error);
    return "টেক্সট পড়া সম্ভব হয়নি।";
  }
};

export const generateStudyPlan = async (subject: string, topic: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Create a concise, 3-bullet point study strategy for: Subject: ${subject}, Topic: ${topic}. Answer in BENGALI language only.`
        })) as GenerateContentResponse;
        return response.text || "প্ল্যান তৈরি করা যায়নি।";
    } catch (error: any) {
        return "১. মূল ধারণাগুলো পড়ুন।\n২. নোট তৈরি করুন।\n৩. নিয়মিত প্র্যাকটিস করুন।";
    }
}

export const analyzeChapter = async (images: ImageInput[]) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const imageParts = await prepareImages(images);
  const prompt = `Act as an expert teacher. Analyze these textbook pages carefully. Provide: 1. Summary, 2. 10 Questions, 3. Key Topics. Answer in BENGALI language. Return a valid JSON format with keys: summary (string), questions (string array), topics (string array).`;

  const response = await retryWithBackoff(() => ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: [...imageParts, { text: prompt }] },
    config: { responseMimeType: 'application/json' }
  })) as GenerateContentResponse;
  
  const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Translate the following text to ${targetLanguage}. Text: ${text}`
    })) as GenerateContentResponse;
    return response.text || "অনুবাদ করা যায়নি।";
};

export const generateQuiz = async (images: ImageInput[]): Promise<QuizQuestion[]> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const imageParts = await prepareImages(images);
    const prompt = `Generate 15 Multiple Choice Questions (MCQs) in BENGALI based on these textbook pages. Return JSON array of objects with keys: question (string), options (array of 4 strings), correctAnswer (integer index 0-3), explanation (string).`;

    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [...imageParts, { text: prompt }] },
        config: { responseMimeType: 'application/json' }
    })) as GenerateContentResponse;

    const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
};

export const askTutor = async (images: ImageInput[], history: any[], question: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const imageParts = await prepareImages(images);
    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [...imageParts, { text: `Answer clearly in BENGALI based on these textbook pages. Question: ${question}` }] }
    })) as GenerateContentResponse;
    return response.text || "দুঃখিত, উত্তর পাওয়া যায়নি।";
};