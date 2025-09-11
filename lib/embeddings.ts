import { generateEmbedding } from './openai';
import { getSupabaseAdmin } from './supabase';
import { ProcessedChunk } from './pdf-processor';
import { v4 as uuidv4 } from 'uuid';

export async function storeDocument(chunk: ProcessedChunk): Promise<void> {
  try {
    const embedding = await generateEmbedding(chunk.content);
    const supabaseAdmin = getSupabaseAdmin();
    
    // Supabase expects vector as a string in SQL format
    const vectorString = `[${embedding.join(',')}]`;
    
    const { error } = await supabaseAdmin
      .from('documents')
      .insert({
        id: uuidv4(),
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: vectorString,
      });

    if (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in storeDocument:', error);
    throw error;
  }
}

export async function searchSimilarDocuments(
  query: string,
  matchCount: number = 10
): Promise<any[]> {
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
    
    // Try RPC function for vector search
    const queryVector = `[${queryEmbedding.join(',')}]`;
    let { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryVector,
      match_count: matchCount,
    });

    console.log('🎯 RPC function result:', { data: data?.length || 0, error });

    if (error || !data || data.length < 3) {
      console.log('❌ Vector search insufficient, using text-based fallback:', error);
      
      // Extract key terms for better fallback search
      const keyTerms = query.split(' ').filter(term => term.length > 1);
      let fallbackData: any[] = [];
      
      // Try searching for key terms
      for (const term of keyTerms.slice(0, 3)) {
        const { data: termData } = await supabaseAdmin
          .from('documents')
          .select('id, content, metadata')
          .ilike('content', `%${term}%`)
          .limit(5);
        
        if (termData) {
          fallbackData = [...fallbackData, ...termData];
        }
      }
      
      // Remove duplicates and limit results
      const uniqueData = fallbackData.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      ).slice(0, matchCount);
      
      if (uniqueData.length > 0) {
        console.log('📋 Keyword search found:', uniqueData.length);
        return uniqueData.map(doc => ({
          ...doc,
          similarity: 0.7 // High score for keyword matches
        }));
      }
      
      return [];
    }

    console.log('✅ Returning RPC results:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('💥 Error in searchSimilarDocuments:', error);
    throw error;
  }
}

export async function clearDocuments(): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error clearing documents:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in clearDocuments:', error);
    throw error;
  }
}