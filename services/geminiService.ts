import { GoogleGenAI, Type } from "@google/genai";
import { Frame, FrameType } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSVGFrame = async (prompt: string): Promise<Frame> => {
  try {
    const modelId = "gemini-2.5-flash"; // Optimized for speed/visual tasks

    const systemPrompt = `
      You are an expert SVG artist. Create a decorative frame overlay for a photo app.
      The frame should be transparent in the center so the user can see themselves.
      The aspect ratio should be roughly 9:16 (vertical mobile screen).
      
      Return ONLY the raw SVG string. 
      Ensure the SVG has width="100%" height="100%" and preserveAspectRatio="xMidYMid slice".
      Use a viewBox of "0 0 1080 1920".
      The content should be stylish, modern, or themed based on the user prompt.
      Do not include markdown code blocks.
    `;

    const fullPrompt = `Create a frame with this theme: ${prompt}. Make sure the center is empty/transparent.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    let svgContent = response.text || "";
    
    // Cleanup if model adds markdown
    svgContent = svgContent.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();

    // Basic validation fallback
    if (!svgContent.includes('<svg')) {
        throw new Error("Failed to generate valid SVG");
    }

    return {
      id: crypto.randomUUID(),
      type: FrameType.SVG,
      content: svgContent,
      name: prompt
    };

  } catch (error) {
    console.error("Gemini Frame Generation Error:", error);
    throw error;
  }
};