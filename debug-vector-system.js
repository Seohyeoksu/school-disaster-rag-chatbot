const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugVectorSystem() {
  console.log('🔍 === 벡터 검색 시스템 전면 점검 ===\n');
  
  // 1. 데이터베이스 함수 존재 확인
  console.log('1️⃣ 데이터베이스 함수 확인...');
  try {
    const { data: functions, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'match_documents');
    
    if (functions && functions.length > 0) {
      console.log('✅ match_documents 함수 존재함');
    } else {
      console.log('❌ match_documents 함수 없음');
    }
  } catch (e) {
    console.log('⚠️ 함수 확인 불가:', e.message);
  }
  
  // 2. 산불 관련 문서 확인
  console.log('\n2️⃣ 산불 관련 문서 확인...');
  const { data: wildfireDocs } = await supabase
    .from('documents')
    .select('id, content, metadata, embedding')
    .ilike('content', '%산불%')
    .limit(3);
    
  console.log(`📄 산불 키워드 포함 문서: ${wildfireDocs?.length || 0}개`);
  wildfireDocs?.forEach((doc, i) => {
    console.log(`  ${i+1}. 페이지 ${doc.metadata.page}: ${doc.content.substring(0, 50)}...`);
    console.log(`     임베딩: ${doc.embedding ? 'Yes' : 'No'}`);
  });
  
  // 3. 임베딩 생성 테스트
  console.log('\n3️⃣ 임베딩 생성 테스트...');
  const testQuery = '산불 대피';
  const result = await embeddingModel.embedContent(testQuery);
  const queryEmbedding = result.embedding.values;
  console.log(`✅ "${testQuery}" 임베딩 생성 완료 (길이: ${queryEmbedding.length})`);
  
  // 4. RPC 함수 직접 호출 테스트
  console.log('\n4️⃣ RPC 함수 직접 호출...');
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 5,
    });
    
    if (rpcError) {
      console.log('❌ RPC 오류:', rpcError);
    } else {
      console.log(`✅ RPC 성공: ${rpcData?.length || 0}개 결과`);
      rpcData?.slice(0, 2).forEach((doc, i) => {
        console.log(`  ${i+1}. 페이지 ${doc.metadata.page} (유사도: ${doc.similarity.toFixed(3)})`);
        console.log(`     내용: ${doc.content.substring(0, 80)}...`);
      });
    }
  } catch (e) {
    console.log('❌ RPC 호출 실패:', e.message);
  }
  
  // 5. 특정 산불 문서로 자체 검색 테스트
  if (wildfireDocs && wildfireDocs.length > 0) {
    console.log('\n5️⃣ 산불 문서 자체 검색 테스트...');
    const wildfireDoc = wildfireDocs[0];
    
    if (wildfireDoc.embedding) {
      try {
        // embedding이 문자열 형태로 저장되어 있을 수 있음
        let testEmbedding;
        if (typeof wildfireDoc.embedding === 'string') {
          testEmbedding = JSON.parse(wildfireDoc.embedding);
        } else {
          testEmbedding = wildfireDoc.embedding;
        }
        
        const { data: selfSearchData } = await supabase.rpc('match_documents', {
          query_embedding: testEmbedding,
          match_count: 3,
        });
        
        console.log(`🔍 자체 검색 결과: ${selfSearchData?.length || 0}개`);
        const foundSelf = selfSearchData?.find(d => d.id === wildfireDoc.id);
        console.log(`🎯 자기 자신 찾기: ${foundSelf ? 'Success' : 'Failed'}`);
        
      } catch (e) {
        console.log('❌ 자체 검색 실패:', e.message);
      }
    }
  }
  
  // 6. 임베딩 형식 확인
  console.log('\n6️⃣ 임베딩 저장 형식 확인...');
  const { data: sampleDoc } = await supabase
    .from('documents')
    .select('embedding')
    .not('embedding', 'is', null)
    .limit(1)
    .single();
    
  if (sampleDoc) {
    console.log('📊 임베딩 타입:', typeof sampleDoc.embedding);
    console.log('📊 임베딩 샘플:', sampleDoc.embedding.toString().substring(0, 100) + '...');
  }
}

debugVectorSystem().catch(console.error);