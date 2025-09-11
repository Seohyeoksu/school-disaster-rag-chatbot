import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('📊 Checking database status...');
    const supabaseAdmin = getSupabaseAdmin();
    
    // Check document count in database
    const { data, error, count } = await supabaseAdmin
      .from('documents')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful!',
      documentCount: count || 0,
      status: count && count > 0 ? 'Documents available' : 'No documents found'
    });
  } catch (error) {
    console.error('❌ Error checking database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to database' },
      { status: 500 }
    );
  }
}