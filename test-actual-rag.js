const { queryRAG } = require('./lib/rag');

async function testActualRAG() {
  const query = "폭우나 홍수 발생시 대응 방법은?";
  console.log(`🔍 Testing RAG function directly: "${query}"`);
  console.log('=' .repeat(60));

  try {
    const result = await queryRAG(query, 5);
    
    console.log('\n📝 Answer:', result.answer);
    console.log('\n📚 Sources provided to GPT:');
    
    if (result.sources && result.sources.length > 0) {
      result.sources.forEach((source, idx) => {
        console.log(`\n${idx + 1}. Page ${source.metadata.page} (Similarity: ${source.similarity.toFixed(3)})`);
        
        // Check for relevant keywords
        const keywords = ['폭우', '홍수', '침수', '호우', '집중호우', '대피'];
        const foundKeywords = keywords.filter(k => source.content.includes(k));
        
        if (foundKeywords.length > 0) {
          console.log(`   ✅ Contains: ${foundKeywords.join(', ')}`);
        } else {
          console.log(`   ⚠️  No flood/rain keywords`);
        }
        
        console.log(`   Preview: ${source.content.substring(0, 200)}...`);
      });
    } else {
      console.log('❌ No sources were provided to GPT');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testActualRAG().catch(console.error);