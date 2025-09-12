// Test the complete RAG API flow as it would be called by the web interface
require('dotenv').config({ path: '.env.local' });

const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Replicate the exact functions from the lib files
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function searchSimilarDocuments(query, matchCount = 10) {
  try {
    console.log('🔍 Searching for query:', query);
    const queryEmbedding = await generateEmbedding(query);
    console.log('✅ Generated embedding, length:', queryEmbedding?.length);
    
    const { data: countData } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true });
    console.log('📊 Total documents in DB:', countData);
    
    // Using the FIXED approach with higher match_count
    const searchCount = Math.max(matchCount, 30);
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: searchCount,
    });

    console.log('🎯 RPC function result:', { data: data?.length || 0, error });

    if (error || !data || data.length === 0) {
      console.log('❌ Vector search failed, using text-based fallback:', error);
      
      const keyTerms = query.split(' ').filter(term => term.length > 1);
      let fallbackData = [];
      
      for (const term of keyTerms.slice(0, 3)) {
        const { data: termData } = await supabase
          .from('documents')
          .select('id, content, metadata')
          .ilike('content', `%${term}%`)
          .limit(5);
        
        if (termData) {
          fallbackData = [...fallbackData, ...termData];
        }
      }
      
      const uniqueData = fallbackData.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      ).slice(0, matchCount);
      
      if (uniqueData.length > 0) {
        return uniqueData.map(doc => ({
          ...doc,
          similarity: 0.7
        }));
      }
      
      return [];
    }

    // Limit results to requested matchCount
    const limitedData = data.slice(0, matchCount);
    console.log('📋 Limited to requested count:', limitedData.length);
    return limitedData;
  } catch (error) {
    console.error('💥 Error in searchSimilarDocuments:', error);
    throw error;
  }
}

async function generateResponse(prompt, context) {
  const fullPrompt = `You are a helpful assistant that answers questions based on the provided context.
  
Context:
${context}

Question: ${prompt}

Instructions:
- Answer based ONLY on the provided context
- If the answer cannot be found in the context, say "I cannot find this information in the provided documents"
- Be concise and accurate
- DO NOT include source citations like (Source 1, Page 129) in your answer
- Just provide the direct answer without citing sources
- Answer in Korean

Answer:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: fullPrompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });

  return response.choices[0].message.content || 'No response generated';
}

async function queryRAG(question, matchCount = 5) {
  try {
    console.log('🔍 RAG: Searching for question:', question);
    const relevantDocs = await searchSimilarDocuments(question, matchCount);
    console.log('🔍 RAG: Found documents:', relevantDocs.length);
    
    if (relevantDocs.length === 0) {
      console.log('❌ RAG: No documents found, returning default message');
      return {
        answer: "No relevant documents found for your question.",
        sources: []
      };
    }
    
    console.log('✅ RAG: Processing', relevantDocs.length, 'documents');
    
    const context = relevantDocs
      .map((doc, index) => `[Source ${index + 1} - ${doc.metadata.source}, Page ${doc.metadata.page}]:\n${doc.content}`)
      .join('\n\n');
    
    const answer = await generateResponse(question, context);
    
    return {
      answer,
      sources: relevantDocs.map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        similarity: doc.similarity
      }))
    };
  } catch (error) {
    console.error('Error in queryRAG:', error);
    throw error;
  }
}

async function testFinalAPI() {
  console.log('🚀 Testing FINAL API - Complete RAG Flow\n');
  console.log('=' .repeat(60));
  
  const wildfireQuestions = [
    '산불이 발생했을 때 학생들은 어떻게 대피해야 하나요?',
    '산불 연기로 인한 피해는 무엇인가요?',
    '근처에 산불이 났을 경우 어떻게 해야 하나요?'
  ];
  
  for (let i = 0; i < wildfireQuestions.length; i++) {
    const question = wildfireQuestions[i];
    console.log(`\n🔥 Test ${i+1}: "${question}"`);
    console.log('-'.repeat(50));
    
    try {
      const result = await queryRAG(question, 5);
      
      // Check for wildfire sources
      const wildfirePages = [139, 140, 142];
      const wildfireSources = result.sources.filter(source => 
        wildfirePages.includes(source.metadata.page)
      );
      
      console.log(`📄 Total sources found: ${result.sources.length}`);
      console.log(`🎯 Wildfire sources: ${wildfireSources.length}`);
      
      if (wildfireSources.length > 0) {
        console.log('✅ SUCCESS - Wildfire content found:');
        wildfireSources.forEach(source => {
          console.log(`   📑 Page ${source.metadata.page} (similarity: ${source.similarity.toFixed(3)})`);
        });
      } else {
        console.log('❌ FAILURE - No wildfire content found');
        console.log('📋 Sources found instead:');
        result.sources.forEach(source => {
          console.log(`   📑 Page ${source.metadata.page} (similarity: ${source.similarity.toFixed(3)})`);
        });
      }
      
      console.log(`\n🤖 Generated Answer:\n"${result.answer}"\n`);
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  console.log('=' .repeat(60));
  console.log('🏁 Final API Test Complete');
}

testFinalAPI().catch(console.error);