const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testWildfireSearch() {
  console.log('🔍 Testing wildfire search...');
  
  const result = await embeddingModel.embedContent('산불 확산 시 학생 안전 조치');
  const queryEmbedding = result.embedding.values;
  console.log('✅ Generated embedding length:', queryEmbedding.length);
  
  // Test with vector format that works
  const { data: rpcData, error: rpcError } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: 10,
  });
  
  console.log('🎯 RPC results:', rpcData?.length || 0);
  if (rpcError) {
    console.error('RPC Error:', rpcError);
  }
  
  if (rpcData && rpcData.length > 0) {
    console.log('Top results:');
    rpcData.slice(0, 3).forEach((doc, i) => {
      console.log(`${i+1}. Similarity: ${doc.similarity.toFixed(3)} - Page: ${doc.metadata.page}`);
      console.log(`   Content: ${doc.content.substring(0, 100)}...`);
    });
  }
  
  // Also test with simpler query
  console.log('\n🔍 Testing simple "산불" query...');
  const result2 = await embeddingModel.embedContent('산불');
  const queryEmbedding2 = result2.embedding.values;
  
  const { data: rpcData2, error: rpcError2 } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding2,
    match_count: 10,
  });
  
  console.log('🎯 Simple RPC results:', rpcData2?.length || 0);
  if (rpcData2 && rpcData2.length > 0) {
    console.log('Top results:');
    rpcData2.slice(0, 3).forEach((doc, i) => {
      console.log(`${i+1}. Similarity: ${doc.similarity.toFixed(3)} - Page: ${doc.metadata.page}`);
      console.log(`   Content: ${doc.content.substring(0, 100)}...`);
    });
  }
}

testWildfireSearch().catch(console.error);