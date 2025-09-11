const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testActualVectorSearch() {
  console.log('🔍 Testing actual vector search with different wildfire queries...\n');
  
  const queries = [
    '산불 발생시 학교 대피 방법은?',
    '산불',
    '산불 대피',
    '산불 연기',
    '근처에 산불이 났을 경우 바람 방향을'  // 실제 매뉴얼 문장
  ];
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`${i+1}. "${query}"`);
    
    // Generate embedding
    const result = await embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding.values;
    
    // Call RPC function
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 10,
    });
    
    if (error) {
      console.log('   ❌ Error:', error);
      continue;
    }
    
    console.log(`   📄 Results: ${data?.length || 0}`);
    
    // Check if wildfire pages are in results
    const wildfirePages = [139, 140, 142];
    const foundWildfirePages = data?.filter(doc => wildfirePages.includes(doc.metadata.page));
    
    console.log(`   🎯 Wildfire pages found: ${foundWildfirePages?.length || 0}`);
    if (foundWildfirePages && foundWildfirePages.length > 0) {
      foundWildfirePages.forEach(doc => {
        console.log(`      ✅ Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)})`);
      });
    } else {
      console.log('      ❌ No wildfire pages found');
      // Show what we got instead
      data?.slice(0, 3).forEach(doc => {
        console.log(`      📋 Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)})`);
      });
    }
    console.log('');
  }
  
  // Direct comparison: Use actual wildfire document embedding
  console.log('🧪 Direct test: Using actual wildfire document embedding...');
  const { data: wildfireDoc } = await supabase
    .from('documents')
    .select('id, content, metadata, embedding')
    .eq('metadata->page', 140)  // Page with "근처에 산불이 났을 경우" content
    .single();
    
  if (wildfireDoc && wildfireDoc.embedding) {
    let embedding;
    try {
      if (typeof wildfireDoc.embedding === 'string') {
        embedding = JSON.parse(wildfireDoc.embedding);
      } else {
        embedding = wildfireDoc.embedding;
      }
      
      const { data: selfSearchData } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_count: 5,
      });
      
      console.log('📊 Self-search results:');
      selfSearchData?.forEach((doc, i) => {
        const isOriginal = doc.id === wildfireDoc.id;
        console.log(`   ${i+1}. Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)}) ${isOriginal ? '← Original' : ''}`);
      });
    } catch (e) {
      console.log('❌ Self-search failed:', e.message);
    }
  }
}

testActualVectorSearch().catch(console.error);