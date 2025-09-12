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
    console.log('🔍 RAG: Searching for question:', question);
    // Increase search count to get more potentially relevant documents
    const searchCount = Math.max(matchCount * 2, 10); // Search for double the requested amount
    const relevantDocs = await searchSimilarDocuments(question, searchCount);
    console.log('🔍 RAG: Found documents:', relevantDocs.length);
    
    if (relevantDocs.length === 0) {
      console.log('❌ RAG: No documents found, returning default message');
      return {
        answer: "No relevant documents found for your question.",
        sources: []
      };
    }
    
    // Filter documents with similarity > 0.25 (lower threshold for better coverage)
    const filteredDocs = relevantDocs.filter(doc => doc.similarity > 0.25);
    console.log(`🔍 RAG: Filtered to ${filteredDocs.length} docs with similarity > 0.25`);
    
    // If no docs pass the threshold, use top docs anyway
    const docsToUse = filteredDocs.length > 0 
      ? filteredDocs.slice(0, matchCount)
      : relevantDocs.slice(0, matchCount);
    
    if (docsToUse.length === 0) {
      console.log('❌ RAG: No documents after filtering, returning default message');
      return {
        answer: "No relevant documents found for your question.",
        sources: []
      };
    }
    
    console.log('✅ RAG: Processing', docsToUse.length, 'documents');
    
    const context = docsToUse
      .map((doc, index) => `[Source ${index + 1} - ${doc.metadata.source}, Page ${doc.metadata.page}]:\n${doc.content}`)
      .join('\n\n');
    
    const answer = await generateResponse(question, context);
    
    return {
      answer,
      sources: docsToUse.map(doc => ({
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