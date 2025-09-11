const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findWildfirePages() {
  console.log('🔍 산불 섹션 페이지 139-142 확인...');
  
  const { data } = await supabase
    .from('documents')
    .select('id, content, metadata, embedding')
    .in('metadata->page', [139, 140, 141, 142]);
    
  console.log(`📄 찾은 문서: ${data?.length || 0}개`);
  
  data?.forEach((doc, i) => {
    const hasWildfire = doc.content.includes('산불');
    console.log(`${i+1}. 페이지 ${doc.metadata.page}: 산불 포함 ${hasWildfire ? 'Yes' : 'No'}`);
    if (hasWildfire) {
      const match = doc.content.match(/.{0,50}산불.{0,50}/gi);
      console.log(`   매칭: ${match?.[0] || 'N/A'}`);
    }
    console.log(`   임베딩: ${doc.embedding ? 'Yes' : 'No'}`);
    console.log(`   내용 미리보기: ${doc.content.substring(0, 100)}...`);
    console.log('');
  });
}

findWildfirePages().catch(console.error);