import { createWorker } from 'tesseract.js';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, ImageInput } from '../types';

// API Key injection from Vite config
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries: number = 5, 
    delay: number = 1000 
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        const isQuotaError = error?.status === 429 || error?.message?.includes('429');
        if (retries > 0 && isQuotaError) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryWithBackoff(operation, retries - 1, delay * 2);
        }
        throw error;
    }
};

const performOCR = async (base64Image: string, mimeType: string): Promise<string> => {
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    const worker = await createWorker('eng');
    try {
        const ret = await worker.recognize(imageUrl);
        await worker.terminate();
        return ret.data.text;
    } catch (error) {
        await worker.terminate();
        return "";
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const text = await performOCR(base64Image, mimeType);
    return text && text.trim().length > 0 ? text : "No readable text found.";
  } catch (error) {
    return "Error extracting text.";
  }
};

export const generateStudyPlan = async (subject: string, topic: string): Promise<string> => {
    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Subject: ${subject}, Topic: ${topic}. Give 3 concise study tips in Bengali.`,
            config: { thinkingConfig: { thinkingBudget: 0 } }
        })) as GenerateContentResponse;
        return response.text || "পড়া শুরু করুন।";
    } catch (error) {
        return "পড়ার পরিকল্পনা তৈরি করা যাচ্ছে না।";
    }
}

const prepareImageParts = (images: ImageInput[]) => {
    return images.map(img => ({
         inlineData: {
             data: img.base64,
             mimeType: img.mimeType
         }
     }));
};

export const analyzeChapter = async (images: ImageInput[]) => {
  try {
     const imageParts = prepareImageParts(images);
     const prompt = `Analyze these pages. Return ONLY JSON in Bengali:
     {
       "summary": "Short Bengali summary",
       "questions": ["5 questions in Bengali"],
       "topics": ["3 topic tags in Bengali"]
     }`;

     const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 }
        }
     })) as GenerateContentResponse;
     
     return JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
      throw error;
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate to ${targetLanguage}: ${text}`,
            config: { thinkingConfig: { thinkingBudget: 0 } }
        })) as GenerateContentResponse;
        return response.text || "Translation failed.";
    } catch (error) {
        return "Error translating.";
    }
};

export const generateQuiz = async (images: ImageInput[]): Promise<QuizQuestion[]> => {
    try {
        const imageParts = prepareImageParts(images);
        const prompt = `Generate 10 MCQs in Bengali as JSON array: [{"question": "", "options": ["", "", "", ""], "correctAnswer": 0, "explanation": ""}]`;

        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [...imageParts, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 0 }
            }
        })) as GenerateContentResponse;

        return JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (error) {
        throw error;
    }
};

export const askTutor = async (images: ImageInput[], history: {role: string, text: string}[], question: string): Promise<string> => {
    try {
        const imageParts = prepareImageParts(images);
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [...imageParts, { text: `Answer briefly in Bengali: ${question}` }] },
            config: { thinkingConfig: { thinkingBudget: 0 } }
        })) as GenerateContentResponse;
        return response.text || "I couldn't find an answer.";
    } catch (error) {
        return "Tutor is currently busy.";
    }
};