const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDirectWildfire() {
  const queries = [
    '산불',
    '산불 대피',
    '산불 연기',
    '근처에 산불이 났을 경우',
    '젖은 수건이나 손으로 코와 입을 막고'
  ];
  
  for (const query of queries) {
    console.log(`\n🔍 Testing: "${query}"`);
    
    const result = await embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding.values;
    
    const { data } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 3,
    });
    
    console.log(`✅ Found ${data?.length || 0} documents:`);
    data?.forEach((doc, i) => {
      console.log(`  ${i+1}. Page ${doc.metadata.page} (${doc.similarity.toFixed(3)}): ${doc.content.substring(0, 80)}...`);
    });
  }
}

testDirectWildfire().catch(console.error);