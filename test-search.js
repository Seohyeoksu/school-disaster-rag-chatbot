const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Testing Supabase connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseServiceKey ? 'Set' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSearch() {
  try {
    // Test 1: Check if documents exist
    console.log('\n📊 Testing document count...');
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count error:', countError);
      return;
    }
    
    console.log('✅ Total documents:', count);
    
    // Test 2: Get sample documents
    console.log('\n📋 Testing document retrieval...');
    const { data, error } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .limit(3);
    
    if (error) {
      console.error('❌ Query error:', error);
      return;
    }
    
    console.log('✅ Sample documents retrieved:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📄 First document preview:', {
        id: data[0].id,
        contentPreview: data[0].content.substring(0, 100) + '...',
        metadata: data[0].metadata
      });
    }
    
    // Test 3: Test RPC function
    console.log('\n🎯 Testing RPC function...');
    const testVector = new Array(768).fill(0.1); // Dummy vector
    const { data: rpcData, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: testVector,
      match_count: 3,
    });
    
    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log('✅ RPC function works! Results:', rpcData?.length || 0);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSearch();