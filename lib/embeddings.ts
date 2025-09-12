import { generateEmbedding } from './openai';
import { getSupabaseAdmin } from './supabase';

// Define keyword mappings for disaster types
const DISASTER_KEYWORDS = {
  '집중호우': ['집중호우', '폭우', '호우', '침수', '홍수'],
  '폭우': ['폭우', '집중호우', '호우', '침수', '홍수'],
  '호우': ['호우', '집중호우', '폭우', '침수', '홍수'],
  '침수': ['침수', '집중호우', '폭우', '호우', '홍수'],
  '홍수': ['홍수', '집중호우', '폭우', '호우', '침수'],
  '산불': ['산불', '화재', '연기'],
  '지진': ['지진', '진동', '흔들림'],
  '태풍': ['태풍', '바람', '강풍'],
  '황사': ['황사', '먼지', '모래'],
  '폭염': ['폭염', '더위', '열사병']
};

function expandQueryWithKeywords(query: string): string[] {
  const expandedQueries = [query]; // Original query first
  
  // Find matching disaster types and add related keywords
  for (const [mainKeyword, synonyms] of Object.entries(DISASTER_KEYWORDS)) {
    if (query.includes(mainKeyword)) {
      // Add queries with synonyms
      synonyms.forEach(synonym => {
        if (synonym !== mainKeyword) {
          expandedQueries.push(query.replace(mainKeyword, synonym));
        }
      });
      break; // Only expand for first matching disaster type
    }
  }
  
  return expandedQueries;
}

export async function searchSimilarDocuments(
  query: string,
  matchCount: number = 10
): Promise<Array<Record<string, any>>> {
  try {
    console.log('🔍 Searching for query:', query);
    
    // Try hybrid search for better results
    const expandedQueries = expandQueryWithKeywords(query);
    console.log('🔄 Expanded queries:', expandedQueries.length > 1 ? expandedQueries : 'none');
    
    const queryEmbedding = await generateEmbedding(query);
    console.log('✅ Generated embedding, length:', queryEmbedding?.length);
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // First check if documents exist at all
    const { data: countData } = await supabaseAdmin
      .from('documents')
      .select('id', { count: 'exact', head: true });
    console.log('📊 Total documents in DB:', countData);
    
    // Try RPC function for vector search with higher match_count to overcome similarity threshold
    // The pgvector search has an implicit similarity threshold that filters out results
    // when match_count is low. Use a higher count then limit results afterwards.
    const searchCount = Math.max(matchCount, 50); // Increased to 50 to get more results including low similarity
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding, // Direct array works better than string format
      match_count: searchCount,
    });

    console.log('🎯 RPC function result:', { data: data?.length || 0, error });

    if (error || !data || data.length === 0) {
      console.log('❌ Vector search insufficient, using enhanced fallback:', error);
      
      // Enhanced fallback with disaster-specific keywords
      let fallbackData: Array<Record<string, any>> = [];
      
      // First try disaster-specific keywords
      const disasterKeywords = [];
      for (const [mainKeyword, synonyms] of Object.entries(DISASTER_KEYWORDS)) {
        if (query.includes(mainKeyword)) {
          disasterKeywords.push(...synonyms);
          break;
        }
      }
      
      if (disasterKeywords.length > 0) {
        console.log('🔍 Searching for disaster keywords:', disasterKeywords.slice(0, 3));
        
        for (const keyword of disasterKeywords.slice(0, 3)) {
          const { data: termData, error: termError } = await supabaseAdmin
            .from('documents')
            .select('id, content, metadata')
            .ilike('content', `%${keyword}%`)
            .limit(5);
          
          console.log(`🔍 Keyword "${keyword}" found:`, termData?.length || 0, 'results');
          if (termError) console.log('🔍 Keyword error:', termError);
          
          if (termData) {
            fallbackData = [...fallbackData, ...termData];
          }
        }
      }
      
      // If still no results, try general terms
      if (fallbackData.length === 0) {
        const keyTerms = query.split(' ').filter(term => term.length > 1);
        console.log('🔍 Searching for general terms:', keyTerms.slice(0, 3));
        
        for (const term of keyTerms.slice(0, 3)) {
          const { data: termData, error: termError } = await supabaseAdmin
            .from('documents')
            .select('id, content, metadata')
            .ilike('content', `%${term}%`)
            .limit(5);
          
          console.log(`🔍 Term "${term}" found:`, termData?.length || 0, 'results');
          if (termError) console.log('🔍 Term error:', termError);
          
          if (termData) {
            fallbackData = [...fallbackData, ...termData];
          }
        }
      }
      
      // Remove duplicates and limit results
      const uniqueData = fallbackData.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      ).slice(0, matchCount);
      
      console.log('📋 Final fallback search results:', uniqueData.length);
      
      if (uniqueData.length > 0) {
        const result = uniqueData.map(doc => ({
          ...doc,
          similarity: 0.7 // High score for keyword matches
        }));
        console.log('📋 Returning fallback results:', result.length);
        return result;
      }
      
      console.log('❌ No results from fallback search either');
      return [];
    }

    console.log('✅ Returning RPC results:', data?.length || 0);
    // Limit results to requested matchCount
    const limitedData = data.slice(0, matchCount);
    console.log('📋 Limited to requested count:', limitedData.length);
    return limitedData;
  } catch (error) {
    console.error('💥 Error in searchSimilarDocuments:', error);
    throw error;
  }
}

