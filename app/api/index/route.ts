import { NextRequest, NextResponse } from 'next/server';
import { processPDF, getAllPDFFiles } from '@/lib/pdf-processor';
import { storeDocument, clearDocuments } from '@/lib/embeddings';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const pdfDir = path.join(process.cwd(), 'pdfs');
    const pdfFiles = await getAllPDFFiles(pdfDir);
    
    if (pdfFiles.length === 0) {
      return NextResponse.json(
        { error: 'No PDF files found in pdfs directory' },
        { status: 400 }
      );
    }
    
    await clearDocuments();
    
    let totalChunks = 0;
    const results = [];
    
    for (const pdfFile of pdfFiles) {
      const fileName = path.basename(pdfFile);
      
      try {
        const chunks = await processPDF(pdfFile);
        
        for (const chunk of chunks) {
          await storeDocument(chunk);
        }
        
        totalChunks += chunks.length;
        results.push({
          file: fileName,
          chunks: chunks.length,
          status: 'success'
        });
      } catch (error) {
        results.push({
          file: fileName,
          error: (error as Error).message,
          status: 'error'
        });
      }
    }
    
    return NextResponse.json({
      message: 'Indexing complete',
      totalChunks,
      results
    });
  } catch (error) {
    console.error('Error in index API:', error);
    return NextResponse.json(
      { error: 'Failed to index PDFs' },
      { status: 500 }
    );
  }
}