
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Message, AIModel } from "../types";

/**
 * Utilitário para pausa assíncrona
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gera conteúdo da história com lógica de resiliência (retentativas)
 * Simula uma infraestrutura robusta lidando com múltiplas requisições.
 */
export const generateStoryContent = async (
  messages: Message[], 
  model: AIModel = 'gemini-3-flash-preview',
  retries: number = 3
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepara o histórico para o Gemini
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: model, 
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.95,
          topP: 0.95,
        },
      });

      return response.text || "Putz, deu um branco aqui na minha cabeça criativa. Vamos tentar de novo?";
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      // Se for erro de limite de taxa (429) ou erro de servidor (5xx), tenta novamente
      const isRetryable = error?.status === 429 || (error?.status >= 500 && error?.status < 600);
      
      if (isRetryable && attempt < retries) {
        // Backoff exponencial: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt) * 500;
        await sleep(delay);
        continue;
      }
      
      break;
    }
  }

  return "Opa, nossos servidores estão recebendo muitas histórias agora! 🌪️ Pode tentar enviar sua mensagem novamente em alguns segundos?";
};
