const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function checkHeavyRainContent() {
  console.log('🔍 Checking Heavy Rain/Flood Content in Database');
  console.log('=' .repeat(60));

  // First, let's check what pages contain heavy rain content directly
  const { data: allDocs, error } = await supabase
    .from('documents')
    .select('content, metadata')
    .order('metadata->page', { ascending: true });

  if (error) {
    console.error('Error fetching documents:', error);
    return;
  }

  console.log(`Total documents in database: ${allDocs.length}`);
  
  // Search for keywords related to heavy rain and flooding
  const keywords = ['폭우', '홍수', '침수', '호우', '집중호우', '대피', '물'];
  const relevantPages = [];

  allDocs.forEach(doc => {
    const content = doc.content.toLowerCase();
    const hasKeyword = keywords.some(keyword => content.includes(keyword));
    
    if (hasKeyword) {
      relevantPages.push({
        page: doc.metadata.page,
        preview: doc.content.substring(0, 200),
        keywords: keywords.filter(k => content.includes(k))
      });
    }
  });

  console.log(`\n📚 Found ${relevantPages.length} pages with heavy rain/flood related content:`);
  
  // Show first 10 relevant pages
  relevantPages.slice(0, 10).forEach(page => {
    console.log(`\nPage ${page.page}:`);
    console.log(`Keywords found: ${page.keywords.join(', ')}`);
    console.log(`Preview: ${page.preview}...`);
  });

  // Now test specific queries
  console.log('\n' + '='.repeat(60));
  console.log('Testing specific heavy rain queries:');
  console.log('='.repeat(60));

  const testQueries = [
    '폭우시 대피 방법은?',
    '홍수가 났을 때 어떻게 대피해야 하나요?',
    '집중호우 대피 요령',
    '비가 많이 올 때 학교에서 어떻게 해야 하나요?',
    '침수 시 행동요령'
  ];

  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // Search with different match counts
      for (const matchCount of [10, 30, 50]) {
        const { data, error } = await supabase.rpc('match_documents', {
          query_embedding: embedding,
          match_count: matchCount,
        });

        if (!error && data && data.length > 0) {
          const topResult = data[0];
          console.log(`  Match count ${matchCount}: Found ${data.length} results`);
          console.log(`    Top result: Page ${topResult.metadata.page} (Similarity: ${topResult.similarity.toFixed(3)})`);
          
          // Check if we found relevant content
          const hasRelevantContent = data.slice(0, 5).some(d => 
            keywords.some(k => d.content.toLowerCase().includes(k))
          );
          
          if (hasRelevantContent) {
            console.log(`    ✅ Found relevant heavy rain content`);
          } else {
            console.log(`    ⚠️ Results may not contain heavy rain content`);
          }
          break; // Only test first successful match count
        }
      }
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  // Check specific pages that should have heavy rain content
  console.log('\n' + '='.repeat(60));
  console.log('Checking specific pages mentioned in manual:');
  console.log('='.repeat(60));

  const specificPages = [42, 43, 44, 45, 46, 47]; // Pages likely to have heavy rain content
  
  for (const pageNum of specificPages) {
    const pageDoc = allDocs.find(d => d.metadata.page === pageNum);
    if (pageDoc) {
      console.log(`\nPage ${pageNum}:`);
      const hasRainContent = keywords.some(k => pageDoc.content.toLowerCase().includes(k));
      console.log(`  Has rain-related content: ${hasRainContent ? '✅ Yes' : '❌ No'}`);
      if (hasRainContent) {
        const foundKeywords = keywords.filter(k => pageDoc.content.toLowerCase().includes(k));
        console.log(`  Keywords found: ${foundKeywords.join(', ')}`);
        console.log(`  Content preview: ${pageDoc.content.substring(0, 150)}...`);
      }
    } else {
      console.log(`\nPage ${pageNum}: ❌ Not found in database`);
    }
  }
}

checkHeavyRainContent().catch(console.error);