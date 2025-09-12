
async function testImprovedHeavyRainSearch() {
  console.log('🔍 Testing Improved Heavy Rain Search via API');
  console.log('=' .repeat(60));

  const testQueries = [
    '폭우시 대피 방법은?',
    '홍수가 났을 때 어떻게 대피해야 하나요?',
    '집중호우 대피 요령',
    '비가 많이 올 때 학교에서 어떻게 해야 하나요?',
    '침수 시 행동요령'
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Testing: "${query}"`);
    console.log('-'.repeat(40));

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      const data = await response.json();

      if (data.answer) {
        console.log('✅ Got answer!');
        console.log('Answer preview:', data.answer.substring(0, 200) + '...');
        
        if (data.sources && data.sources.length > 0) {
          console.log(`\n📚 Sources (${data.sources.length}):`);
          data.sources.forEach((source, idx) => {
            console.log(`  ${idx + 1}. Page ${source.metadata.page} (Similarity: ${source.similarity.toFixed(3)})`);
          });
        } else {
          console.log('⚠️  No sources provided');
        }
      } else {
        console.log('❌ No answer received');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed!');
}

testImprovedHeavyRainSearch().catch(console.error);