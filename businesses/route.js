// [2024-09-26] - Businesses API for Admin app
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5NzQ4NzMsImV4cCI6MjAzNzU1MDg3M30.8Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/businesses - Get businesses for admin
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let query = supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('partnership_status', status);
    }

    const { data: businesses, error } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch businesses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: businesses || [],
      pagination: {
        limit,
        offset,
        total: businesses?.length || 0
      }
    });

  } catch (error) {
    console.error('Businesses GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/businesses - Create new business
export async function POST(request) {
  try {
    const businessData = await request.json();
    
    const { data: business, error } = await supabase
      .from('businesses')
      .insert([businessData])
      .select()
      .single();

    if (error) {
      console.error('Error creating business:', error);
      return NextResponse.json(
        { error: 'Failed to create business' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: business
    }, { status: 201 });

  } catch (error) {
    console.error('Businesses POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
