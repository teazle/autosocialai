import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Store kill switch state in memory (in production, use Redis or database)
let globalKillSwitchEnabled = false;

export async function GET() {
  return NextResponse.json({ enabled: globalKillSwitchEnabled });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled } = body;
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid enabled value' },
        { status: 400 }
      );
    }

    globalKillSwitchEnabled = enabled;

    // TODO: Persist this to database or Redis
    // For now, it's in-memory only
    
    return NextResponse.json({ enabled: globalKillSwitchEnabled });
  } catch (error) {
    console.error('Error setting kill switch:', error);
    return NextResponse.json(
      { error: 'Failed to set kill switch' },
      { status: 500 }
    );
  }
}

// Export function to check kill switch status (for worker)
export function isKillSwitchEnabled() {
  return globalKillSwitchEnabled;
}

