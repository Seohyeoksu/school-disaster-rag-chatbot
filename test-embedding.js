const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithRealEmbedding() {
  try {
    console.log('🔍 Testing with real embedding for "화재"...');
    
    // Generate real embedding
    const result = await embeddingModel.embedContent("화재");
    const queryEmbedding = result.embedding.values;
    console.log('✅ Generated embedding, length:', queryEmbedding.length);
    
    // Test RPC function with real embedding
    const { data: rpcData, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 5,
    });
    
    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log('✅ RPC function results:', rpcData?.length || 0);
      if (rpcData && rpcData.length > 0) {
        console.log('🎯 First result:', {
          similarity: rpcData[0].similarity,
          contentPreview: rpcData[0].content.substring(0, 100) + '...'
        });
      }
    }
    
    // Alternative: Direct vector search
    console.log('\n🔄 Trying alternative approach...');
    const { data: directData, error: directError } = await supabase
      .from('documents')
      .select('id, content, metadata, embedding')
      .limit(5);
    
    if (directError) {
      console.error('❌ Direct query error:', directError);
    } else {
      console.log('📋 Direct results:', directData?.length || 0);
      if (directData && directData.length > 0) {
        console.log('📊 Sample embedding info:', {
          hasEmbedding: directData[0].embedding ? 'Yes' : 'No',
          embeddingType: typeof directData[0].embedding,
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testWithRealEmbedding();