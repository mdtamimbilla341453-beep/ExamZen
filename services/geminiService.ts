import { createWorker } from 'tesseract.js';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, ImageInput } from '../types';

// Helper to get a fresh AI instance with the current API Key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
            const dataUrl = canvas.toDataURL(mimeType, 0.7); // 70% quality for faster processing
            resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => resolve(base64);
    });
};

// --- Helper: Improved Retry Logic ---
const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 2000 
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        const errorMessage = error?.message?.toLowerCase() || "";
        const isRateLimit = errorMessage.includes('429') || errorMessage.includes('quota');
        
        if (retries > 0 && (isRateLimit || errorMessage.includes('500') || errorMessage.includes('overloaded'))) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryWithBackoff(operation, retries - 1, delay * 1.5);
        }
        
        if (isRateLimit) {
            throw new Error("এপিআই লিমিট শেষ। ১ মিনিট পর আবার চেষ্টা করুন।");
        }
        throw new Error("এপিআই কানেকশন ফেইল হয়েছে। অনুগ্রহ করে ইন্টারনেট বা কী চেক করুন।");
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
    const worker = await createWorker('eng+ben'); // Multi-language OCR
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    const ret = await worker.recognize(imageUrl);
    await worker.terminate();
    return ret.data.text || "No text found.";
  } catch (error) {
    console.error("OCR Error:", error);
    return "টেক্সট এক্সট্রাক্ট করা সম্ভব হয়নি।";
  }
};

export const generateStudyPlan = async (subject: string, topic: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a concise, 3-bullet point study strategy for: Subject: ${subject}, Topic: ${topic}. Language: BENGALI.`
        })) as GenerateContentResponse;
        return response.text || "প্ল্যান তৈরি করা সম্ভব হয়নি।";
    } catch (error) {
        return "১. রিভিশন দিন।\n২. নোট পড়ুন।\n৩. নিয়মিত প্র্যাকটিস করুন।";
    }
}

export const analyzeChapter = async (images: ImageInput[]) => {
  const ai = getAI();
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
    const ai = getAI();
    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate to ${targetLanguage}: ${text}`
    })) as GenerateContentResponse;
    return response.text || "অনুবাদ ব্যর্থ হয়েছে।";
};

export const generateQuiz = async (images: ImageInput[]): Promise<QuizQuestion[]> => {
    const ai = getAI();
    const imageParts = await prepareImages(images);
    const prompt = `Generate 15 MCQs in BENGALI from these pages. Return JSON array of objects with keys: question, options (array of 4), correctAnswer (index), explanation.`;

    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: { responseMimeType: 'application/json' }
    })) as GenerateContentResponse;

    return JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
};

export const askTutor = async (images: ImageInput[], history: any[], question: string): Promise<string> => {
    const ai = getAI();
    const imageParts = await prepareImages(images);
    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts, { text: `Tutor session. Answer in BENGALI. Question: ${question}` }] }
    })) as GenerateContentResponse;
    return response.text || "দুঃখিত, আমি উত্তরটি খুঁজে পাচ্ছি না।";
};