import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { DesignState, MetalType, GemType, ProductType, ProngType, GemCut } from '../types';

const API_KEY = process.env.API_KEY || '';

// Define the tool for the model to call
const updateDesignTool: FunctionDeclaration = {
  name: 'updateDesign',
  description: 'Update the jewelry design configuration based on user request.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productType: {
        type: Type.STRING,
        enum: Object.values(ProductType),
        description: 'The type of jewelry item.'
      },
      metal: {
        type: Type.STRING,
        enum: Object.values(MetalType),
        description: 'The metal material for the band/body.'
      },
      gem: {
        type: Type.STRING,
        enum: Object.values(GemType),
        description: 'The gemstone type.'
      },
      gemCut: {
        type: Type.STRING,
        enum: Object.values(GemCut),
        description: 'The cut or shape of the gem (Round, Princess, Emerald, Oval, Pear).'
      },
      gemSize: {
        type: Type.NUMBER,
        description: 'The size of the gem (0.5 to 3.0).',
      },
      bandWidth: {
        type: Type.NUMBER,
        description: 'The width or thickness of the metal band (1.0 to 5.0).',
      },
      prong: {
        type: Type.STRING,
        enum: Object.values(ProngType),
        description: 'The style of setting/prongs holding the gem.'
      }
    },
  },
};

export const interpretDesignRequest = async (
  prompt: string, 
  currentDesign: DesignState
): Promise<{ text: string; updates?: Partial<DesignState> }> => {
  if (!API_KEY) {
    return { text: "API Key is missing. Please configure it to use AI features." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const systemInstruction = `You are a helpful, expert jewelry design assistant for 'LuxeCraft 3D'. 
    Your goal is to help users design their perfect ring, bangle, or pendant.
    Current Design Context: ${JSON.stringify(currentDesign)}
    
    If the user asks to change something, use the 'updateDesign' tool. 
    If the user asks for advice, give a short, elegant professional recommendation (max 2 sentences) and then optionally call the tool if they implied a change.
    For 'reset' or 'clear', set gem to None and metal to Silver.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [updateDesignTool] }],
        temperature: 0.7,
      }
    });

    let textResponse = response.text || "";
    let updates: Partial<DesignState> | undefined = undefined;

    const functionCalls = response.functionCalls;
    if (functionCalls) {
        for (const fc of functionCalls) {
            if (fc.name === 'updateDesign') {
                // Extract arguments. The SDK types might be slightly different at runtime, so we cast safely
                const args = fc.args as any;
                updates = {};
                if (args.metal) updates.metal = args.metal as MetalType;
                if (args.gem) updates.gem = args.gem as GemType;
                if (args.gemCut) updates.gemCut = args.gemCut as GemCut;
                if (args.productType) updates.productType = args.productType as ProductType;
                if (args.gemSize) updates.gemSize = Number(args.gemSize);
                if (args.bandWidth) updates.bandWidth = Number(args.bandWidth);
                if (args.prong) updates.prong = args.prong as ProngType;
                
                if (!textResponse) {
                    textResponse = "Design updated based on your request.";
                }
            }
        }
    }

    return { text: textResponse, updates };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I'm having trouble connecting to the design server. Please try again." };
  }
};

export const generateReceiptDescription = async (design: DesignState): Promise<string> => {
    if (!API_KEY) return "LuxeCraft Custom Design";

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = `Write a short, luxurious, 1-sentence description for a jewelry piece with these specs: 
    Type: ${design.productType}, Metal: ${design.metal}, Gem: ${design.gem}, Cut: ${design.gemCut}, Prongs: ${design.prong}, Engraving: "${design.engraving}". 
    Make it sound expensive.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Custom Luxury Piece";
    } catch (e) {
        return "Custom Luxury Piece";
    }
}