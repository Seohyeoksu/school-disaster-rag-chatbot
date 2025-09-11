import { GoogleGenerativeAI } from '@google/generative-ai';

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

function getGeminiPro() {
  return getGenAI().getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp'
  });
}

function getEmbeddingModel() {
  return getGenAI().getGenerativeModel({ 
    model: 'text-embedding-004' 
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = getEmbeddingModel();
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export async function generateResponse(prompt: string, context: string): Promise<string> {
  const geminiPro = getGeminiPro();
  const fullPrompt = `You are a helpful assistant that answers questions based on the provided context.
  
Context:
${context}

Question: ${prompt}

Instructions:
- Answer based ONLY on the provided context
- If the answer cannot be found in the context, say "I cannot find this information in the provided documents"
- Be concise and accurate
- DO NOT include source citations like (Source 1, Page 129) in your answer
- Just provide the direct answer without citing sources

Answer:`;

  const result = await geminiPro.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}