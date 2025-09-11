import pdf from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';

export interface ProcessedChunk {
  content: string;
  metadata: {
    source: string;
    page: number;
    total_pages: number;
    chunk_index: number;
    total_chunks: number;
  };
}

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    
    if (end === text.length) break;
    start = end - overlap;
  }

  return chunks;
}

export async function processPDF(filePath: string): Promise<ProcessedChunk[]> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  const fileName = path.basename(filePath);
  
  const chunks = chunkText(data.text);
  
  return chunks.map((chunk, index) => ({
    content: chunk,
    metadata: {
      source: fileName,
      page: Math.floor((index * 1000) / (data.text.length / data.numpages)) + 1,
      total_pages: data.numpages,
      chunk_index: index,
      total_chunks: chunks.length,
    },
  }));
}

export async function getAllPDFFiles(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    const pdfFiles = files
      .filter(file => path.extname(file).toLowerCase() === '.pdf')
      .map(file => path.join(dirPath, file));
    return pdfFiles;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}