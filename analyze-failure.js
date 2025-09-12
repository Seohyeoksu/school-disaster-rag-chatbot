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

async function analyzeFailureCase() {
  const failingQuery = "집중호우 발생시 대피 방법은?";
  const workingQuery = "침수 시 행동요령은?";
  
  console.log('🔍 실패 케이스 분석');
  console.log('='.repeat(60));
  
  for (const [label, query] of [['❌ 실패', failingQuery], ['✅ 성공', workingQuery]]) {
    console.log(`\n${label}: "${query}"`);
    console.log('-'.repeat(40));
    
    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Get search results
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: 20,
    });
    
    if (error || !data) {
      console.log('검색 오류:', error);
      continue;
    }
    
    console.log(`검색된 문서: ${data.length}개`);
    
    // Show top 5 with keyword analysis
    console.log('\n상위 5개 결과:');
    data.slice(0, 5).forEach((doc, idx) => {
      const keywords = ['집중호우', '폭우', '홍수', '침수', '호우', '대피', '비'];
      const foundKeywords = keywords.filter(k => doc.content.includes(k));
      
      console.log(`${idx + 1}. Page ${doc.metadata.page} (${doc.similarity.toFixed(3)})`);
      console.log(`   키워드: ${foundKeywords.length > 0 ? foundKeywords.join(', ') : '없음'}`);
      console.log(`   미리보기: ${doc.content.substring(0, 100)}...`);
    });
    
    // Find the best relevant document
    const relevantDocs = data.filter(doc => {
      const content = doc.content.toLowerCase();
      return content.includes('집중호우') || content.includes('폭우') || 
             content.includes('홍수') || content.includes('침수') || 
             content.includes('호우');
    });
    
    if (relevantDocs.length > 0) {
      const best = relevantDocs[0];
      console.log(`\n🎯 최적 관련 문서: Page ${best.metadata.page} (유사도: ${best.similarity.toFixed(3)})`);
      console.log(`전체 순위: ${data.findIndex(d => d.id === best.id) + 1}번째`);
    } else {
      console.log('\n⚠️ 관련 키워드가 포함된 문서를 찾을 수 없음');
    }
    
    // Test actual API call
    console.log('\n🔧 API 테스트 결과:');
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });
      
      const apiData = await response.json();
      const hasAnswer = apiData.answer && 
                       !apiData.answer.includes('찾을 수 없습니다') && 
                       !apiData.answer.includes('cannot find');
      
      console.log(`결과: ${hasAnswer ? '성공' : '실패'}`);
      console.log(`소스 개수: ${apiData.sources?.length || 0}`);
      if (apiData.sources?.length > 0) {
        console.log('전달된 소스들:');
        apiData.sources.slice(0, 3).forEach((s, i) => {
          console.log(`  ${i+1}. Page ${s.metadata.page} (${s.similarity.toFixed(3)})`);
        });
      }
    } catch (error) {
      console.log(`API 오류: ${error.message}`);
    }
  }
  
  // 해결 방안 제시
  console.log('\n' + '='.repeat(60));
  console.log('💡 개선 방안');
  console.log('='.repeat(60));
  
  console.log('1. 쿼리 전처리: "집중호우 발생시" → "집중호우", "호우", "폭우" 키워드 추출');
  console.log('2. 동의어 확장: 집중호우 ↔ 폭우 ↔ 호우 ↔ 침수');
  console.log('3. 하이브리드 검색: 벡터 검색 + 키워드 검색 결합');
  console.log('4. 컨텍스트 강화: 관련 문서를 더 많이 포함');
}

analyzeFailureCase().catch(console.error);