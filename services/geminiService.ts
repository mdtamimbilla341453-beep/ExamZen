// Note: Filename kept as geminiService.ts to avoid breaking imports in other files.
import { createWorker } from 'tesseract.js';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, ImageInput } from '../types';

// Per guidelines: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Exponential Backoff Retry ---
const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries: number = 10, // Increased to 10 to handle strict free tier limits
    delay: number = 5000 // Start with 5 seconds delay
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        // Check for 429 (Resource Exhausted) or common rate limit indicators
        const isQuotaError = 
            error?.code === 429 || 
            error?.status === 429 || 
            (error?.message && error.message.includes('429')) ||
            (error?.message && error.message.toLowerCase().includes('quota')) ||
            (error?.message && error.message.toLowerCase().includes('resource_exhausted'));
            
        if (retries > 0 && isQuotaError) {
            console.warn(`Quota exceeded (429). Retrying in ${delay/1000}s... (${retries} attempts left)`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            // Exponential backoff with a cap of 60 seconds
            const nextDelay = Math.min(delay * 2, 60000); 
            return retryWithBackoff(operation, retries - 1, nextDelay);
        }
        throw error;
    }
};

// --- Tesseract OCR Helper (Kept for Smart Notes single-page text extraction) ---
const performOCR = async (base64Image: string, mimeType: string): Promise<string> => {
    // Tesseract expects a standard image source (url, base64 with prefix, etc.)
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    
    // Initialize worker with English language
    const worker = await createWorker('eng');
    
    try {
        const ret = await worker.recognize(imageUrl);
        await worker.terminate();
        return ret.data.text;
    } catch (error) {
        await worker.terminate();
        throw error;
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    console.log("Starting Tesseract OCR...");
    const text = await performOCR(base64Image, mimeType);
    
    if (!text || text.trim().length === 0) {
        return "No readable text found in the image.";
    }
    return text;
  } catch (error) {
    console.error("OCR Error:", error);
    // Fallback message if OCR completely fails
    return "Error extracting text. Please ensure the image is clear.";
  }
};

export const generateStudyPlan = async (subject: string, topic: string): Promise<string> => {
    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a helpful student assistant. Create a concise, 3-bullet point study strategy for the topic "${topic}" in the subject "${subject}". Keep it motivating and actionable for a student.`
        })) as GenerateContentResponse;
        
        return response.text || "Focus on key concepts and practice problems.";
    } catch (error) {
        console.error("Study Plan Error:", error);
        // Fallback to avoid breaking the UI when quota is hit
        return `1. Review ${topic} definitions.\n2. Practice 5 past problems.\n3. Summarize your notes. (AI offline due to high traffic)`;
    }
}

// Re-export ImageInput for convenience if needed, though it's defined in types
export { type ImageInput };

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
     console.log(`Analyzing ${images.length} images with Gemini Vision...`);

     const imageParts = prepareImageParts(images);

     const prompt = `
     Act as an expert teacher. Analyze these textbook pages.
     
     Task:
     1. Provide a detailed Summary (সারসংক্ষেপ) of the content.
     2. List 10 Important Questions (গুরুত্বপূর্ণ প্রশ্ন) based on the content.
     3. Identify key topics/keywords.
     
     CRITICAL: The entire output content (summary, questions, topics) must be in BENGALI language only. Do not use English for the content.
     
     Return the result strictly as a valid JSON object with this exact structure (keep keys in English):
     {
       "summary": "Bengali summary text...",
       "questions": ["Bengali question 1", "Bengali question 2", ...],
       "topics": ["Bengali topic 1", "Bengali topic 2", ...]
     }
     `;

     const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [...imageParts, { text: prompt }]
        },
        config: {
            responseMimeType: 'application/json'
        }
     })) as GenerateContentResponse;
     
     let text = response.text || "";
     // Clean up markdown if present to ensure JSON.parse works
     text = text.replace(/```json/g, '').replace(/```/g, '').trim();

     if (text) {
         return JSON.parse(text);
     }
     throw new Error("Empty response from AI");
  } catch (error) {
      console.error("Analysis Error:", error);
      throw error;
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following academic text into ${targetLanguage}. Maintain the formal tone and terminology suitable for a student.\n\nText to translate:\n${text}`
        })) as GenerateContentResponse;
        return response.text || "Translation failed.";
    } catch (error) {
        console.error("Translation Error:", error);
        return "Error translating text. Please try again later (Quota Exceeded).";
    }
};

export const generateQuiz = async (images: ImageInput[]): Promise<QuizQuestion[]> => {
    try {
        const imageParts = prepareImageParts(images);
        const prompt = `
        Read the provided text deeply. Generate a comprehensive and exhaustive list of MCQs (Target: 15 to 20 questions or more). 
        Cover every small detail, definition, and concept from the text. 
        
        CRITICAL: Generate all questions, options, and explanations in BENGALI (Bangla) language.

        Format the output strictly as a JSON array of objects with this structure:
        [
            {
                "question": "The question text in Bengali?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0, // 0 for A, 1 for B, etc.
                "explanation": "Brief explanation of why this is correct in Bengali."
            }
        ]
        `;

        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [...imageParts, { text: prompt }]
            },
            config: {
                responseMimeType: 'application/json'
            }
        })) as GenerateContentResponse;

        let text = response.text || "";
        // Clean up markdown if present to ensure JSON.parse works
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        if (text) {
            return JSON.parse(text);
        }
        throw new Error("Empty response");
    } catch (error) {
        console.error("Quiz Gen Error", error);
        throw error;
    }
};

export const askTutor = async (images: ImageInput[], history: {role: string, text: string}[], question: string): Promise<string> => {
    try {
        const imageParts = prepareImageParts(images);
        
        // Construct conversation history logic if needed, but for 'Chat with Book', 
        // we often just need the context + current question.
        // We will send images + question.
        
        const prompt = `
        You are a helpful and friendly tutor. The user is asking a question about the provided textbook pages.
        Answer simply and clearly. If the user asks for an explanation, use analogies suitable for a student.
        
        User Question: "${question}"
        `;

        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [...imageParts, { text: prompt }]
            }
        })) as GenerateContentResponse;

        return response.text || "I couldn't understand that context.";
    } catch (error) {
        console.error("Tutor Error", error);
        return "Sorry, I'm taking a break right now (High Traffic). Please ask again in a minute.";
    }
};