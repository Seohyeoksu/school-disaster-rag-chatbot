const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function searchSimilarDocuments(query, matchCount = 10) {
  console.log('🔍 Searching for query:', query);
  const queryEmbedding = await generateEmbedding(query);
  console.log('✅ Generated embedding, length:', queryEmbedding?.length);
  
  // Try RPC function for vector search
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  console.log('🎯 RPC function result:', { data: data?.length || 0, error });

  if (error || !data || data.length < 3) {
    console.log('❌ Vector search insufficient, using text-based fallback:', error);
    
    // Extract key terms for better fallback search
    const keyTerms = query.split(' ').filter(term => term.length > 1);
    let fallbackData = [];
    
    console.log('🔍 Searching for key terms:', keyTerms.slice(0, 3));
    
    // Try searching for key terms
    for (const term of keyTerms.slice(0, 3)) {
      const { data: termData, error: termError } = await supabase
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
  return data || [];
}

async function testRAGWildfire() {
  console.log('🔥 Testing RAG system with wildfire queries...\n');
  
  const queries = [
    '산불이 발생했을 때 학생들은 어떻게 대피해야 하나요?',
    '산불 연기로 인한 피해는 무엇인가요?',
    '근처에 산불이 났을 경우 어떻게 해야 하나요?',
    '산불 대피 시 주의사항은?'
  ];
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`${i+1}. Question: "${query}"`);
    console.log('─'.repeat(50));
    
    try {
      const relevantDocs = await searchSimilarDocuments(query, 5);
      
      if (relevantDocs.length === 0) {
        console.log('❌ No relevant documents found');
      } else {
        console.log(`📄 Found ${relevantDocs.length} relevant documents:`);
        
        // Check if any are from wildfire pages
        const wildfirePages = [139, 140, 142];
        const wildfireDocs = relevantDocs.filter(doc => wildfirePages.includes(doc.metadata.page));
        
        if (wildfireDocs.length > 0) {
          console.log(`🎯 ${wildfireDocs.length} wildfire documents found:`);
          wildfireDocs.forEach(doc => {
            console.log(`   ✅ Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)})`);
            console.log(`      "${doc.content.substring(0, 80)}..."`);
          });
        } else {
          console.log('❌ No wildfire-specific documents found');
          console.log('📋 Top results:');
          relevantDocs.slice(0, 3).forEach(doc => {
            console.log(`   Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)})`);
            console.log(`   "${doc.content.substring(0, 60)}..."`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('');
  }
}

testRAGWildfire().catch(console.error);