
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, ImageInput } from '../types';

// Always use process.env.API_KEY for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini 3 Flash for fast multimodal OCR and text extraction.
 */
export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    // FIX: Using contents: { parts: [...] } structure as per Google GenAI SDK standards
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: "Extract all text from this image as accurately as possible. Return only the extracted text." },
        ],
      },
    });
    return response.text?.trim() || "No readable text found.";
  } catch (error) {
    console.error("OCR Error:", error);
    return "Error extracting text.";
  }
};

/**
 * Generates a focused study plan using Gemini 3 Flash.
 */
export const generateStudyPlan = async (subject: string, topic: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Subject: ${subject}, Topic: ${topic}. Give 3 concise study tips in Bengali.`,
        });
        return response.text || "পড়ার পরিকল্পনা তৈরি করা যাচ্ছে না।";
    } catch (error) {
        return "পড়ার পরিকল্পনা তৈরি করা যাচ্ছে না।";
    }
};

/**
 * Analyzes multiple chapter pages using a 'Strict Exam Examiner' persona.
 * Optimized for processing 10+ pages simultaneously.
 */
export const analyzeChapter = async (images: ImageInput[]) => {
  try {
     // Personified prompt for comprehensive multi-page analysis
     const prompt = `Act as a strict Exam Examiner. Read these sequential pages of a chapter. 
     Provide a comprehensive summary of the topics covered in Bengali. 
     Then, list the Top 10 Most Likely Exam Questions based on this content in Bengali.
     Return the result in ONLY JSON format following the schema provided. 
     Analyze ALL provided images carefully to ensure context is maintained across pages.`;

     // FIX: Constructing parts as a single array literal to avoid TypeScript inference issues with .push()
     const parts = [
       ...images.map(img => ({
         inlineData: {
           data: img.base64,
           mimeType: img.mimeType
         }
       })),
       { text: prompt }
     ];

     const response = await ai.models.generateContent({
       model: 'gemini-3-flash-preview',
       contents: { parts },
       config: {
         responseMimeType: "application/json",
         responseSchema: {
           type: Type.OBJECT,
           properties: {
             summary: { 
                type: Type.STRING, 
                description: "A detailed comprehensive summary in Bengali." 
             },
             questions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "List of exactly 10 exam questions in Bengali." 
             },
             topics: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "5-7 key topic tags in Bengali." 
             }
           },
           required: ["summary", "questions", "topics"]
         }
       }
     });
     
     const jsonStr = response.text || '{}';
     return JSON.parse(jsonStr);
  } catch (error) {
      console.error("Analysis Error:", error);
      throw error;
  }
};

/**
 * Translates academic text while preserving tone.
 */
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Translate to ${targetLanguage} while maintaining an academic tone: ${text}`,
        });
        return response.text || "Error translating.";
    } catch (error) {
        return "Error translating.";
    }
};

/**
 * Generates an interactive quiz based on chapter content.
 */
export const generateQuiz = async (images: ImageInput[]): Promise<QuizQuestion[]> => {
    try {
        const prompt = `Generate 10 challenging MCQs based on the provided study material in Bengali. Each question must have exactly 4 options, a correct answer index, and a detailed explanation.`;
        
        // FIX: Constructing parts as a single array literal to avoid TypeScript inference issues with .push()
        const parts = [
          ...images.map(img => ({
            inlineData: {
              data: img.base64,
              mimeType: img.mimeType
            }
          })),
          { text: prompt }
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: { parts },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswer: { type: Type.INTEGER, description: "0-based index of correct option" },
                      explanation: { type: Type.STRING }
                    },
                    required: ["question", "options", "correctAnswer", "explanation"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        });
        const parsed = JSON.parse(response.text || '{"questions":[]}');
        return parsed.questions;
    } catch (error) {
        console.error("Quiz Generation Error:", error);
        throw error;
    }
};

/**
 * Real-time tutor interaction based on uploaded materials.
 */
export const askTutor = async (images: ImageInput[], history: {role: string, text: string}[], question: string): Promise<string> => {
    try {
        const imageParts = images.map(img => ({
          inlineData: {
            data: img.base64,
            mimeType: img.mimeType
          }
        }));
        
        const historyParts = history.map(msg => ({
          text: `${msg.role === 'model' ? 'Tutor' : 'Student'}: ${msg.text}`
        }));
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { 
            parts: [
              ...imageParts,
              ...historyParts,
              { text: `Answer briefly in Bengali based on the provided material: ${question}` }
            ] 
          },
          config: {
            systemInstruction: "You are an expert academic tutor. Use the provided book images to answer student questions in Bengali accurately and concisely."
          }
        });
        
        return response.text || "Tutor is currently busy.";
    } catch (error) {
        console.error("Tutor Error:", error);
        return "Tutor is currently busy.";
    }
};
