require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDatabase() {
  console.log('🔍 Debugging database content...');
  
  // Check total documents
  const { data: countData, count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true });
  
  console.log(`📊 Total documents: ${count}`);
  
  // Get first few documents to see content
  const { data: docs } = await supabase
    .from('documents')
    .select('id, content, metadata')
    .limit(3);
  
  console.log('\n📄 Sample documents:');
  docs?.forEach((doc, i) => {
    console.log(`\n--- Document ${i + 1} ---`);
    console.log(`ID: ${doc.id}`);
    console.log(`Content preview: "${doc.content.substring(0, 200)}..."`);
    console.log(`Metadata:`, doc.metadata);
  });
  
  // Test keyword search for common Korean terms
  const testTerms = ['화재', '대피', '산불', '학교', '안전'];
  console.log('\n🔍 Testing keyword searches:');
  
  for (const term of testTerms) {
    const { data: results } = await supabase
      .from('documents')
      .select('id, content')
      .ilike('content', `%${term}%`)
      .limit(2);
    
    console.log(`\n"${term}": ${results?.length || 0} results`);
    if (results && results.length > 0) {
      console.log(`  First result: "${results[0].content.substring(0, 100)}..."`);
    }
  }
}

debugDatabase().catch(console.error);