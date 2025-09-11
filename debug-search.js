const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugSearch() {
  console.log('🔍 Debug: 산불 발생시 학교 대피 방법은?');
  
  const result = await embeddingModel.embedContent('산불 발생시 학교 대피 방법은?');
  const queryEmbedding = result.embedding.values;
  
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: 5,
  });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ Found', data?.length || 0, 'documents');
  
  data?.forEach((doc, i) => {
    console.log(`\n📄 Document ${i+1} (Page ${doc.metadata.page}, Similarity: ${doc.similarity.toFixed(3)}):`);
    console.log(doc.content.substring(0, 200) + '...');
  });
  
  // Test if these contain wildfire content
  const wildfireKeywords = ['산불', '화재', '대피', '안전'];
  data?.forEach((doc, i) => {
    const matches = wildfireKeywords.filter(keyword => doc.content.includes(keyword));
    if (matches.length > 0) {
      console.log(`\n🎯 Document ${i+1} contains keywords:`, matches);
    }
  });
}

debugSearch().catch(console.error);