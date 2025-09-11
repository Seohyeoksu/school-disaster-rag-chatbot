const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkWildfirePages() {
  const { data, error } = await supabase
    .from('documents')
    .select('id, content, metadata, embedding')
    .in('metadata->page', [139, 140, 141, 142]);
    
  console.log('산불 섹션 문서:', data?.length || 0);
  
  if (data && data.length > 0) {
    data.forEach((doc, i) => {
      console.log(`페이지 ${doc.metadata.page}:`);
      console.log('- 임베딩 존재:', doc.embedding ? 'Yes' : 'No');
      console.log('- 내용:', doc.content.substring(0, 100) + '...');
      console.log('');
    });
    
    // Test direct vector search with a wildfire document
    console.log('🔍 Testing direct vector search on wildfire page...');
    const wildfireDoc = data.find(d => d.content.includes('산불'));
    if (wildfireDoc && wildfireDoc.embedding) {
      console.log('✅ Found wildfire document with embedding on page', wildfireDoc.metadata.page);
      
      // Test search
      const { data: searchData } = await supabase.rpc('match_documents', {
        query_embedding: wildfireDoc.embedding,
        match_count: 3,
      });
      
      console.log('🎯 Self-search results:', searchData?.length || 0);
    } else {
      console.log('❌ No wildfire document with embedding found');
    }
  } else {
    console.log('❌ No documents found for wildfire pages');
  }
}

checkWildfirePages().catch(console.error);