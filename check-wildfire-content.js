const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getWildfirePages() {
  // Get documents from pages 139-142 (wildfire section)
  const { data, error } = await supabase
    .from('documents')
    .select('content, metadata')
    .in('metadata->page', [139, 140, 141, 142])
    .order('metadata->page');
    
  console.log('산불 섹션 문서:', data?.length || 0);
  data?.forEach((doc, i) => {
    console.log(`=== 페이지 ${doc.metadata.page} ===`);
    console.log(doc.content.substring(0, 300));
    console.log('');
  });
  
  // Also check for any document containing wildfire safety measures
  console.log('=== 안전조치 관련 검색 ===');
  const { data: safetyData } = await supabase
    .from('documents')
    .select('content, metadata')
    .ilike('content', '%안전조치%')
    .limit(3);
    
  safetyData?.forEach((doc, i) => {
    if (doc.content.includes('산불') || doc.content.includes('화재')) {
      console.log(`페이지 ${doc.metadata.page}:`);
      console.log(doc.content.substring(0, 200));
      console.log('---');
    }
  });
}

getWildfirePages().catch(console.error);