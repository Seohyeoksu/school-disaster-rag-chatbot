import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { processPDF, getAllPDFFiles } from '../lib/pdf-processor';
import { storeDocument, clearDocuments } from '../lib/embeddings';

async function indexPDFs() {
  const pdfDir = path.join(process.cwd(), 'pdfs');
  
  console.log('📚 Starting PDF indexing...');
  console.log(`📁 Looking for PDFs in: ${pdfDir}`);
  
  try {
    const pdfFiles = await getAllPDFFiles(pdfDir);
    
    if (pdfFiles.length === 0) {
      console.log('❌ No PDF files found in the pdfs directory');
      console.log('💡 Please add PDF files to the pdfs folder and try again');
      return;
    }
    
    console.log(`📑 Found ${pdfFiles.length} PDF file(s)`);
    
    console.log('🗑️ Clearing existing documents...');
    await clearDocuments();
    
    let totalChunks = 0;
    
    for (const pdfFile of pdfFiles) {
      const fileName = path.basename(pdfFile);
      console.log(`\n📖 Processing: ${fileName}`);
      
      try {
        const chunks = await processPDF(pdfFile);
        console.log(`   ✂️ Split into ${chunks.length} chunks`);
        
        for (let i = 0; i < chunks.length; i++) {
          await storeDocument(chunks[i]);
          process.stdout.write(`   📝 Storing chunk ${i + 1}/${chunks.length}\r`);
        }
        
        console.log(`   ✅ Successfully processed ${fileName}`);
        totalChunks += chunks.length;
      } catch (error) {
        console.error(`   ❌ Error processing ${fileName}:`, error);
      }
    }
    
    console.log(`\n✨ Indexing complete! Total chunks stored: ${totalChunks}`);
  } catch (error) {
    console.error('❌ Error during indexing:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  indexPDFs().catch(console.error);
}

export { indexPDFs };