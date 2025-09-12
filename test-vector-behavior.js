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

async function testVectorBehavior() {
  console.log('🔍 Testing vector search behavior...\n');
  
  const testQuery = '산불 대피 방법';
  const embedding = await generateEmbedding(testQuery);
  
  console.log(`Query: "${testQuery}"`);
  console.log(`Embedding dimension: ${embedding.length}`);
  
  // Test different match_count values
  const testCounts = [1, 5, 10, 20, 50];
  
  for (const count of testCounts) {
    console.log(`\n📊 Testing match_count = ${count}:`);
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: count,
    });
    
    if (error) {
      console.log(`❌ Error:`, error);
      continue;
    }
    
    console.log(`   Found: ${data?.length || 0} results`);
    
    if (data && data.length > 0) {
      // Show similarity range
      const similarities = data.map(d => d.similarity);
      console.log(`   Similarity range: ${Math.min(...similarities).toFixed(4)} - ${Math.max(...similarities).toFixed(4)}`);
      
      // Check for wildfire pages
      const wildfirePages = data.filter(d => [139, 140, 142].includes(d.metadata.page));
      if (wildfirePages.length > 0) {
        console.log(`   🎯 Wildfire pages: ${wildfirePages.length}`);
        wildfirePages.forEach(p => {
          const rank = data.findIndex(d => d.id === p.id) + 1;
          console.log(`      Rank ${rank}: Page ${p.metadata.page} (${p.similarity.toFixed(4)})`);
        });
      } else {
        console.log(`   ❌ No wildfire pages found`);
      }
      
      // Show top 3 results
      if (data.length <= 5) {
        data.forEach((d, i) => {
          console.log(`   ${i+1}. Page ${d.metadata.page} (${d.similarity.toFixed(4)})`);
        });
      }
    }
  }
  
  // Direct test: Query for exact wildfire content
  console.log('\n🧪 Direct content test with exact phrase:');
  const exactPhrase = '근처에 산불이 났을 경우 바람 방향을 감안하여 산불의 진행경로에서 대피한다';
  const exactEmbedding = await generateEmbedding(exactPhrase);
  
  const { data: exactResults } = await supabase.rpc('match_documents', {
    query_embedding: exactEmbedding,
    match_count: 10,
  });
  
  console.log(`Exact phrase results: ${exactResults?.length || 0}`);
  if (exactResults && exactResults.length > 0) {
    exactResults.slice(0, 5).forEach((d, i) => {
      const isWildfire = [139, 140, 142].includes(d.metadata.page);
      console.log(`  ${i+1}. Page ${d.metadata.page} (${d.similarity.toFixed(4)}) ${isWildfire ? '🔥' : ''}`);
    });
  }
  
  // Test with broader similarity - check if there's a hidden threshold
  console.log('\n🔍 Testing with very broad query:');
  const broadEmbedding = await generateEmbedding('학교 안전');
  
  const { data: broadResults } = await supabase.rpc('match_documents', {
    query_embedding: broadEmbedding,
    match_count: 100,  // Very high count
  });
  
  console.log(`Broad query results: ${broadResults?.length || 0}`);
  if (broadResults) {
    const similarities = broadResults.map(d => d.similarity);
    console.log(`Similarity distribution:`);
    console.log(`  Min: ${Math.min(...similarities).toFixed(4)}`);
    console.log(`  Max: ${Math.max(...similarities).toFixed(4)}`);
    console.log(`  25th percentile: ${similarities.sort((a,b) => b-a)[Math.floor(similarities.length * 0.25)].toFixed(4)}`);
    console.log(`  50th percentile: ${similarities.sort((a,b) => b-a)[Math.floor(similarities.length * 0.5)].toFixed(4)}`);
    console.log(`  75th percentile: ${similarities.sort((a,b) => b-a)[Math.floor(similarities.length * 0.75)].toFixed(4)}`);
  }
}

testVectorBehavior().catch(console.error);