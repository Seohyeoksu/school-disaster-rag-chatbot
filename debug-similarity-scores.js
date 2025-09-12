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

async function debugSimilarityScores() {
  console.log('🔍 Debugging similarity scores for wildfire queries...\n');
  
  const queries = [
    '산불',  // Simple wildfire term
    '대피', // Simple evacuation term  
    '학교',  // Simple school term
    '안전',  // Simple safety term
  ];
  
  for (const query of queries) {
    console.log(`Query: "${query}"`);
    console.log('─'.repeat(40));
    
    const queryEmbedding = await generateEmbedding(query);
    
    // Get top 10 results to see similarity distribution
    const { data: results, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 10,
    });
    
    if (error) {
      console.log('❌ Error:', error);
      continue;
    }
    
    console.log(`📊 Found ${results?.length || 0} results:`);
    
    if (results && results.length > 0) {
      // Show all results with similarity scores
      results.forEach((doc, i) => {
        const isWildfire = [139, 140, 142].includes(doc.metadata.page);
        console.log(`  ${i+1}. Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(4)}) ${isWildfire ? '🔥' : ''}`);
        if (i < 3) {  // Show content for top 3
          console.log(`     "${doc.content.substring(0, 60)}..."`);
        }
      });
      
      // Check lowest similarity score
      const minSimilarity = Math.min(...results.map(r => r.similarity));
      const maxSimilarity = Math.max(...results.map(r => r.similarity));
      console.log(`📊 Similarity range: ${minSimilarity.toFixed(4)} - ${maxSimilarity.toFixed(4)}`);
      
      // Check if wildfire pages are in results
      const wildfireResults = results.filter(r => [139, 140, 142].includes(r.metadata.page));
      if (wildfireResults.length > 0) {
        console.log(`🎯 Wildfire pages found: ${wildfireResults.length}`);
        wildfireResults.forEach(r => {
          console.log(`   Page ${r.metadata.page}: ${r.similarity.toFixed(4)}`);
        });
      } else {
        console.log('❌ No wildfire pages in top 10 results');
      }
    } else {
      console.log('❌ No results found');
    }
    
    console.log('');
  }
  
  // Test with a high match_count to see if there's a low threshold
  console.log('🔍 Testing with high match_count (50)...');
  const testEmbedding = await generateEmbedding('산불 대피');
  const { data: manyResults } = await supabase.rpc('match_documents', {
    query_embedding: testEmbedding,
    match_count: 50,
  });
  
  console.log(`📊 With match_count=50, found ${manyResults?.length || 0} results`);
  
  if (manyResults) {
    const wildfireInMany = manyResults.filter(r => [139, 140, 142].includes(r.metadata.page));
    if (wildfireInMany.length > 0) {
      console.log(`🎯 Wildfire pages in top 50:`);
      wildfireInMany.forEach(r => {
        const rank = manyResults.findIndex(doc => doc.id === r.id) + 1;
        console.log(`   Rank ${rank}: Page ${r.metadata.page} (similarity: ${r.similarity.toFixed(4)})`);
      });
    }
    
    // Show similarity distribution
    const similarities = manyResults.map(r => r.similarity);
    console.log(`📊 Similarity stats:`);
    console.log(`   Min: ${Math.min(...similarities).toFixed(4)}`);
    console.log(`   Max: ${Math.max(...similarities).toFixed(4)}`);
    console.log(`   Avg: ${(similarities.reduce((a, b) => a + b, 0) / similarities.length).toFixed(4)}`);
  }
}

debugSimilarityScores().catch(console.error);