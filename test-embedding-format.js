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

async function testEmbeddingFormat() {
  console.log('🔍 Testing different embedding formats...\n');
  
  const testQuery = '산불 대피 방법';
  const embedding = await generateEmbedding(testQuery);
  
  console.log(`Query: "${testQuery}"`);
  console.log(`Embedding length: ${embedding.length}`);
  
  // Test 1: Direct array (like working test scripts)
  console.log('\n1️⃣ Testing with direct array format:');
  try {
    const { data: directData, error: directError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,  // Direct array
      match_count: 30,
    });
    
    console.log(`✅ Direct array: ${directData?.length || 0} results`);
    if (directError) console.log('Error:', directError);
    
    if (directData && directData.length > 0) {
      const wildfirePages = directData.filter(d => [139, 140, 142].includes(d.metadata.page));
      console.log(`🎯 Wildfire pages found: ${wildfirePages.length}`);
      wildfirePages.forEach(p => {
        const rank = directData.findIndex(d => d.id === p.id) + 1;
        console.log(`   Rank ${rank}: Page ${p.metadata.page} (${p.similarity.toFixed(4)})`);
      });
    }
  } catch (e) {
    console.log('❌ Direct array failed:', e.message);
  }
  
  // Test 2: String format (like current lib/embeddings.ts)
  console.log('\n2️⃣ Testing with string format (current embeddings.ts):');
  try {
    const queryVector = `[${embedding.join(',')}]`;  // String format like embeddings.ts
    const { data: stringData, error: stringError } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_count: 30,
    });
    
    console.log(`✅ String format: ${stringData?.length || 0} results`);
    if (stringError) console.log('Error:', stringError);
    
    if (stringData && stringData.length > 0) {
      const wildfirePages = stringData.filter(d => [139, 140, 142].includes(d.metadata.page));
      console.log(`🎯 Wildfire pages found: ${wildfirePages.length}`);
      wildfirePages.forEach(p => {
        const rank = stringData.findIndex(d => d.id === p.id) + 1;
        console.log(`   Rank ${rank}: Page ${p.metadata.page} (${p.similarity.toFixed(4)})`);
      });
    }
  } catch (e) {
    console.log('❌ String format failed:', e.message);
  }
  
  // Test 3: Test with lower match_count using both formats
  console.log('\n3️⃣ Testing with match_count=5:');
  
  // Direct array with count=5
  const { data: directLow } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: 5,
  });
  console.log(`Direct array (count=5): ${directLow?.length || 0} results`);
  
  // String format with count=5
  const queryVector5 = `[${embedding.join(',')}]`;
  const { data: stringLow } = await supabase.rpc('match_documents', {
    query_embedding: queryVector5,
    match_count: 5,
  });
  console.log(`String format (count=5): ${stringLow?.length || 0} results`);
}

testEmbeddingFormat().catch(console.error);