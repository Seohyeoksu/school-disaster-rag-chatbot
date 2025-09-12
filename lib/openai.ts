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
  
  const fullPrompt = `You are a helpful assistant specialized in school disaster response that answers questions based on the provided context.
  
Context:
${context}

Question: ${prompt}

Instructions:
- Answer based on the provided context, being flexible and comprehensive
- Look for relevant information that can be applied to the question, even if not explicitly matching
- For disaster-related questions, extract and combine ALL relevant safety information from the context
- If the context contains information about similar disasters or related safety measures, adapt and use that information
- For example: 
  - Heavy rain (집중호우) information can be used for flood (홍수) questions
  - Evacuation procedures are similar across different disasters
  - Safety measures often apply to multiple disaster types
- Only say "제공된 문서에서 해당 정보를 찾을 수 없습니다" if absolutely no relevant safety information exists
- Be comprehensive and helpful - combine multiple pieces of related information
- DO NOT include source citations in your answer
- Answer in Korean with clear, actionable guidance

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