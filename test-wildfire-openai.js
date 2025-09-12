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

async function testWildfireOpenAI() {
  console.log('🔍 Testing wildfire search with OpenAI embeddings...\n');
  
  const queries = [
    '산불 확산 시 학생 안전 조치',
    '산불',
    '산불 대피',
    '산불 연기',
    '근처에 산불이 났을 경우 바람 방향을 감안하여'
  ];
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`${i+1}. Testing: "${query}"`);
    
    try {
      // Generate OpenAI embedding
      const queryEmbedding = await generateEmbedding(query);
      console.log(`   ✅ Generated embedding (${queryEmbedding.length} dimensions)`);
      
      // Search using RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_count: 10,
      });
      
      if (rpcError) {
        console.log('   ❌ RPC Error:', rpcError);
        continue;
      }
      
      console.log(`   📄 Found ${rpcData?.length || 0} documents`);
      
      // Check for wildfire pages specifically
      const wildfirePages = [139, 140, 142];
      const foundWildfirePages = rpcData?.filter(doc => wildfirePages.includes(doc.metadata.page));
      
      if (foundWildfirePages && foundWildfirePages.length > 0) {
        console.log(`   🎯 Wildfire pages found: ${foundWildfirePages.length}`);
        foundWildfirePages.forEach(doc => {
          console.log(`      ✅ Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)})`);
          console.log(`         Content: ${doc.content.substring(0, 80)}...`);
        });
      } else {
        console.log('   ❌ No wildfire pages found');
        // Show top results for analysis
        console.log('   📋 Top results instead:');
        rpcData?.slice(0, 3).forEach(doc => {
          console.log(`      Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)})`);
          console.log(`      Content: ${doc.content.substring(0, 60)}...`);
        });
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
    
    console.log('');
  }
}

testWildfireOpenAI().catch(console.error);