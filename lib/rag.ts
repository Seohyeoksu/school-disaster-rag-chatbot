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
    const searchCount = Math.max(matchCount * 4, 20); // Search for 4x the requested amount to ensure we get relevant docs
    const relevantDocs = await searchSimilarDocuments(question, searchCount);
    console.log('🔍 RAG: Found documents:', relevantDocs.length);
    
    if (relevantDocs.length === 0) {
      console.log('❌ RAG: No documents found, returning default message');
      return {
        answer: "No relevant documents found for your question.",
        sources: []
      };
    }
    
    // Use a more lenient similarity threshold and take more documents
    const filteredDocs = relevantDocs.filter(doc => doc.similarity > 0.15);
    console.log(`🔍 RAG: Filtered to ${filteredDocs.length} docs with similarity > 0.15`);
    
    // Take up to 10 documents to ensure we don't miss relevant content
    const docsToUse = filteredDocs.length > 0 
      ? filteredDocs.slice(0, Math.max(matchCount, 10))
      : relevantDocs.slice(0, Math.max(matchCount, 10));
    
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