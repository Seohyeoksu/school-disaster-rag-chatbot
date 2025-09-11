const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testExtendedSearch() {
  console.log('🔍 Testing extended vector search (up to 30 results)...\n');
  
  const query = '산불 발생시 학교 대피 방법은?';
  console.log(`Query: "${query}"`);
  
  // Generate embedding
  const result = await embeddingModel.embedContent(query);
  const queryEmbedding = result.embedding.values;
  
  // Search with more results
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: 30,  // Much more results
  });
  
  if (error) {
    console.log('❌ Error:', error);
    return;
  }
  
  console.log(`📄 Total results: ${data?.length || 0}\n`);
  
  // Check all results for wildfire pages
  const wildfirePages = [139, 140, 142];
  let foundWildfireDocs = [];
  
  data?.forEach((doc, i) => {
    if (wildfirePages.includes(doc.metadata.page)) {
      foundWildfireDocs.push({...doc, rank: i + 1});
    }
  });
  
  if (foundWildfireDocs.length > 0) {
    console.log('🎯 Found wildfire documents in extended search:');
    foundWildfireDocs.forEach(doc => {
      console.log(`   ✅ Rank ${doc.rank}: Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)})`);
      console.log(`      Content: ${doc.content.substring(0, 80)}...`);
    });
  } else {
    console.log('❌ Still no wildfire documents found even with 30 results');
    console.log('\n📊 Top 10 results instead:');
    data?.slice(0, 10).forEach((doc, i) => {
      console.log(`   ${i+1}. Page ${doc.metadata.page} (similarity: ${doc.similarity.toFixed(3)})`);
    });
  }
  
  // Check similarity range
  if (data && data.length > 0) {
    console.log(`\n📈 Similarity range: ${data[0].similarity.toFixed(3)} to ${data[data.length-1].similarity.toFixed(3)}`);
  }
}

testExtendedSearch().catch(console.error);