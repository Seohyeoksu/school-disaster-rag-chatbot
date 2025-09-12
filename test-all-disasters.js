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

async function testDisasterSearch(query, disasterType) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${disasterType}: "${query}"`);
  console.log('='.repeat(60));

  try {
    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    console.log(`✓ Generated embedding (${embedding.length} dimensions)`);

    // Search with increased match count
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: 30,
    });

    if (error) {
      console.error('❌ Search error:', error);
      return;
    }

    // Filter and show top 5 results
    const topResults = data.slice(0, 5);
    
    if (topResults.length === 0) {
      console.log('❌ No results found!');
    } else {
      console.log(`\n✓ Found ${data.length} total results, showing top 5:\n`);
      topResults.forEach((result, index) => {
        console.log(`${index + 1}. Page ${result.metadata.page} (Similarity: ${result.similarity.toFixed(3)})`);
        console.log(`   Content preview: ${result.content.substring(0, 150)}...`);
      });
    }

    // Check if we found relevant content
    const relevantResults = topResults.filter(r => r.similarity > 0.35);
    if (relevantResults.length > 0) {
      console.log(`\n✅ SUCCESS: Found ${relevantResults.length} relevant results with good similarity scores`);
    } else {
      console.log('\n⚠️  WARNING: Results have low similarity scores, may not be relevant');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runAllTests() {
  console.log('🔍 Testing RAG System for All Disaster Types');
  console.log('=' .repeat(60));

  const testCases = [
    // 지진 관련
    { query: '지진이 발생하면 어떻게 행동해야 하나요?', type: '지진 (Earthquake)' },
    { query: '지진 발생시 학교에서 대피 방법', type: '지진 (Earthquake)' },
    
    // 태풍 관련
    { query: '태풍이 올 때 학교 안전 조치는?', type: '태풍 (Typhoon)' },
    { query: '태풍 경보시 학생 대피 절차', type: '태풍 (Typhoon)' },
    
    // 폭우/홍수 관련
    { query: '폭우나 홍수 발생시 대응 방법은?', type: '폭우/홍수 (Heavy Rain/Flood)' },
    { query: '집중호우시 학교 침수 대응', type: '폭우/홍수 (Heavy Rain/Flood)' },
    
    // 화재 관련
    { query: '학교 화재시 대피 방법', type: '화재 (Fire)' },
    { query: '화재 발생시 소화기 사용법', type: '화재 (Fire)' },
    
    // 폭설 관련
    { query: '폭설시 학교 안전 대책', type: '폭설 (Heavy Snow)' },
    
    // 미세먼지 관련
    { query: '미세먼지가 심할 때 학교 대응', type: '미세먼지 (Fine Dust)' },
    
    // 감염병 관련
    { query: '감염병 발생시 학교 대응 절차', type: '감염병 (Infectious Disease)' },
    
    // 산불 관련 (이미 수정됨)
    { query: '산불 발생시 학생 대피 방법', type: '산불 (Wildfire)' }
  ];

  for (const testCase of testCases) {
    await testDisasterSearch(testCase.query, testCase.type);
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('='.repeat(60));
}

// Run the tests
runAllTests().catch(console.error);