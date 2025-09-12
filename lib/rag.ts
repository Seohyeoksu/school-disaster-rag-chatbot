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
    
    // Smart document filtering with keyword prioritization
    const keywordWeights = {
      '집중호우': ['집중호우', '폭우', '호우', '침수', '홍수'],
      '폭우': ['폭우', '집중호우', '호우', '침수', '홍수'],
      '호우': ['호우', '집중호우', '폭우', '침수', '홍수'],
      '침수': ['침수', '집중호우', '폭우', '호우', '홍수'],
      '홍수': ['홍수', '집중호우', '폭우', '호우', '침수']
    };
    
    // Check if this is a disaster-specific query
    let targetKeywords: string[] = [];
    for (const [mainKeyword, synonyms] of Object.entries(keywordWeights)) {
      if (question.includes(mainKeyword)) {
        targetKeywords = synonyms;
        break;
      }
    }
    
    let docsToUse = [];
    
    if (targetKeywords.length > 0) {
      // For disaster-specific queries, prioritize documents with relevant keywords
      console.log(`🎯 RAG: Prioritizing documents with keywords: ${targetKeywords.slice(0, 3).join(', ')}`);
      
      // Score documents based on keyword presence
      const scoredDocs = relevantDocs.map(doc => {
        const content = doc.content.toLowerCase();
        let keywordScore = 0;
        
        targetKeywords.forEach(keyword => {
          if (content.includes(keyword)) {
            keywordScore += 1;
          }
        });
        
        return {
          ...doc,
          keywordScore,
          combinedScore: doc.similarity * 0.3 + keywordScore * 0.7 // 70% keyword, 30% similarity
        };
      });
      
      // Sort by combined score and take documents with keyword matches first
      const keywordDocs = scoredDocs.filter(doc => doc.keywordScore > 0)
        .sort((a, b) => b.combinedScore - a.combinedScore);
      
      const nonKeywordDocs = scoredDocs.filter(doc => doc.keywordScore === 0 && doc.similarity > 0.15)
        .sort((a, b) => b.similarity - a.similarity);
      
      console.log(`🔍 RAG: Found ${keywordDocs.length} docs with keywords, ${nonKeywordDocs.length} without`);
      
      // Combine both lists, prioritizing keyword matches
      docsToUse = [
        ...keywordDocs.slice(0, Math.max(matchCount, 8)),
        ...nonKeywordDocs.slice(0, Math.max(2, matchCount - keywordDocs.length))
      ].slice(0, Math.max(matchCount, 10));
      
    } else {
      // For non-disaster queries, use similarity-based filtering
      const filteredDocs = relevantDocs.filter(doc => doc.similarity > 0.15);
      console.log(`🔍 RAG: Filtered to ${filteredDocs.length} docs with similarity > 0.15`);
      
      docsToUse = filteredDocs.length > 0 
        ? filteredDocs.slice(0, Math.max(matchCount, 10))
        : relevantDocs.slice(0, Math.max(matchCount, 10));
    }
    
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