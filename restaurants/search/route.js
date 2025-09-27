// [2024-09-26] - Restaurant search endpoint
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5NzQ4NzMsImV4cCI6MjAzNzU1MDg3M30.8Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/restaurants/search - Search restaurants
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const location = searchParams.get('location');
    const radius = parseInt(searchParams.get('radius')) || 5000;
    const limit = parseInt(searchParams.get('limit')) || 20;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search restaurants by name, cuisine, or description
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .or(`name.ilike.%${query}%,cuisine_type.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      console.error('Error searching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to search restaurants' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: restaurants || [],
      search: {
        query,
        location,
        radius
      }
    });

  } catch (error) {
    console.error('Restaurant search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
