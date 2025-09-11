import { NextRequest, NextResponse } from 'next/server';
import { queryRAG } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    const response = await queryRAG(question);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}