const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testExactQuery() {
  const query = "폭우나 홍수 발생시 대응 방법은?";
  console.log(`🔍 Testing exact query: "${query}"`);
  console.log('=' .repeat(60));

  // Generate embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  
  const embedding = embeddingResponse.data[0].embedding;
  console.log(`✓ Generated embedding (${embedding.length} dimensions)`);

  // Test with different match counts
  for (const matchCount of [50, 100]) {
    console.log(`\n📊 Testing with match_count=${matchCount}`);
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: matchCount,
    });

    if (error) {
      console.error('❌ Error:', error);
      continue;
    }

    console.log(`Found ${data.length} results`);
    
    // Show top 10 results with content preview
    console.log('\nTop 10 results:');
    data.slice(0, 10).forEach((result, idx) => {
      console.log(`\n${idx + 1}. Page ${result.metadata.page} (Similarity: ${result.similarity.toFixed(3)})`);
      
      // Check if content contains relevant keywords
      const keywords = ['폭우', '홍수', '침수', '호우', '집중호우', '대피', '비'];
      const foundKeywords = keywords.filter(k => result.content.includes(k));
      
      if (foundKeywords.length > 0) {
        console.log(`   ✅ Contains keywords: ${foundKeywords.join(', ')}`);
      } else {
        console.log(`   ⚠️  No direct keywords found`);
      }
      
      // Show content preview
      console.log(`   Preview: ${result.content.substring(0, 150).replace(/\n/g, ' ')}...`);
    });
    
    // Find best result with actual flood/rain content
    const relevantResults = data.filter(r => {
      const content = r.content.toLowerCase();
      return content.includes('폭우') || content.includes('홍수') || 
             content.includes('침수') || content.includes('호우') || 
             content.includes('집중호우');
    });
    
    if (relevantResults.length > 0) {
      console.log(`\n✅ Found ${relevantResults.length} results with flood/rain keywords`);
      console.log('Best relevant result:');
      const best = relevantResults[0];
      console.log(`   Page ${best.metadata.page} (Similarity: ${best.similarity.toFixed(3)})`);
      console.log(`   Content: ${best.content.substring(0, 300)}...`);
    } else {
      console.log('\n❌ No results contain flood/rain keywords');
    }
  }
}

testExactQuery().catch(console.error);