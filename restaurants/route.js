// [2024-09-26] - Restaurants API for Consumer app
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5NzQ4NzMsImV4cCI6MjAzNzU1MDg3M30.8Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/restaurants - Get restaurants with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const cuisine = searchParams.get('cuisine');
    const priceRange = searchParams.get('priceRange');
    const rating = searchParams.get('rating');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + limit - 1);

    if (cuisine) {
      query = query.eq('cuisine_type', cuisine);
    }

    if (priceRange) {
      query = query.eq('price_level', priceRange);
    }

    if (rating) {
      query = query.gte('rating', parseFloat(rating));
    }

    const { data: restaurants, error } = await query;

    if (error) {
      console.error('Error fetching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: restaurants || [],
      pagination: {
        limit,
        offset,
        total: restaurants?.length || 0
      }
    });

  } catch (error) {
    console.error('Restaurants GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/restaurants - Create new restaurant
export async function POST(request) {
  try {
    const restaurantData = await request.json();
    
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single();

    if (error) {
      console.error('Error creating restaurant:', error);
      return NextResponse.json(
        { error: 'Failed to create restaurant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: restaurant
    }, { status: 201 });

  } catch (error) {
    console.error('Restaurants POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
