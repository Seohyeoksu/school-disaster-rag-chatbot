const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkWildfireEmbeddings() {
  console.log('=== 산불 페이지 임베딩 확인 ===\n');
  
  // Check specific wildfire pages
  const { data: wildfireDocs } = await supabase
    .from('documents')
    .select('id, content, metadata, embedding')
    .in('metadata->page', [139, 140, 142])
    .order('metadata->page');
    
  console.log('총', wildfireDocs?.length || 0, '개 산불 문서 발견');
  
  wildfireDocs?.forEach((doc, i) => {
    console.log(`\n페이지 ${doc.metadata.page}:`);
    console.log('내용:', doc.content.substring(0, 100) + '...');
    console.log('임베딩 존재:', doc.embedding ? 'Yes' : 'No');
    if (doc.embedding) {
      const embeddingArray = typeof doc.embedding === 'string' ? JSON.parse(doc.embedding) : doc.embedding;
      console.log('임베딩 크기:', embeddingArray.length);
      console.log('임베딩 타입:', typeof doc.embedding);
    }
  });
  
  // Check total documents with embeddings
  const { data: allDocs, count } = await supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .not('embedding', 'is', null);
    
  console.log(`\n=== 전체 임베딩 보유 문서: ${count}개 ===`);
  
  // Test a wildfire document's own embedding for search
  if (wildfireDocs && wildfireDocs.length > 0) {
    const testDoc = wildfireDocs.find(doc => doc.metadata.page === 140);
    if (testDoc && testDoc.embedding) {
      console.log('\n=== 산불 문서 자체 검색 테스트 ===');
      
      let embedding;
      if (typeof testDoc.embedding === 'string') {
        embedding = JSON.parse(testDoc.embedding);
      } else {
        embedding = testDoc.embedding;
      }
      
      const { data: searchResults, error } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_count: 5,
      });
      
      if (error) {
        console.log('❌ 검색 오류:', error);
      } else {
        console.log(`✅ 자체 검색 결과: ${searchResults?.length || 0}개`);
        searchResults?.forEach((result, i) => {
          const isOriginal = result.id === testDoc.id;
          console.log(`  ${i+1}. 페이지 ${result.metadata.page} (유사도: ${result.similarity.toFixed(3)}) ${isOriginal ? '← 원본' : ''}`);
        });
      }
    }
  }
}

checkWildfireEmbeddings().catch(console.error);