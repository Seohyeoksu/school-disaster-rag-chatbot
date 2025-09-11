import { searchSimilarDocuments } from './embeddings';
import { generateResponse } from './openai';

export interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
    similarity: number;
  }>;
}

export async function queryRAG(
  question: string,
  matchCount: number = 5
): Promise<RAGResponse> {
  try {
    const relevantDocs = await searchSimilarDocuments(question, matchCount);
    
    if (relevantDocs.length === 0) {
      return {
        answer: "No relevant documents found for your question.",
        sources: []
      };
    }
    
    const context = relevantDocs
      .map((doc, index) => `[Source ${index + 1} - ${doc.metadata.source}, Page ${doc.metadata.page}]:\n${doc.content}`)
      .join('\n\n');
    
    const answer = await generateResponse(question, context);
    
    return {
      answer,
      sources: relevantDocs.map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        similarity: doc.similarity
      }))
    };
  } catch (error) {
    console.error('Error in queryRAG:', error);
    throw error;
  }
}