import { OpenAI } from 'openai';

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function generateResponse(prompt: string, context: string): Promise<string> {
  const openai = getOpenAI();
  
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
- Answer in Korean

Answer:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: fullPrompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });

  return response.choices[0].message.content || 'No response generated';
}