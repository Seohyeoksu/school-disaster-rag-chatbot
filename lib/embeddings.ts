import { generateEmbedding } from './openai';
import { getSupabaseAdmin } from './supabase';

export async function searchSimilarDocuments(
  query: string,
  matchCount: number = 10
): Promise<Array<Record<string, any>>> {
  try {
    console.log('🔍 Searching for query:', query);
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
      console.log('❌ Vector search insufficient, using text-based fallback:', error);
      
      // Extract key terms for better fallback search
      const keyTerms = query.split(' ').filter(term => term.length > 1);
      let fallbackData: Array<Record<string, any>> = [];
      
      console.log('🔍 Searching for key terms:', keyTerms.slice(0, 3));
      
      // Try searching for key terms
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
      
      // Remove duplicates and limit results
      const uniqueData = fallbackData.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      ).slice(0, matchCount);
      
      console.log('📋 Final keyword search results:', uniqueData.length);
      
      if (uniqueData.length > 0) {
        const result = uniqueData.map(doc => ({
          ...doc,
          similarity: 0.7 // High score for keyword matches
        }));
        console.log('📋 Returning keyword results:', result.length);
        return result;
      }
      
      console.log('❌ No results from keyword search either');
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

