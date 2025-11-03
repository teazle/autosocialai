import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { invalidatePromptsCache } from '@/lib/ai/system-prompts';
import { invalidateReplicateModelCache } from '@/lib/ai/get-replicate-model';

/**
 * GET /api/admin/settings - Fetch all system settings
 */
export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) {
      throw error;
    }

    // Convert array to object for easier access
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        updated_at: setting.updated_at,
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ settings: settingsObject });
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings - Update system settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Update each setting
    const updates = Object.entries(settings).map(async ([key, value]) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ 
          value: typeof value === 'string' ? value : JSON.stringify(value),
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select()
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        throw error;
      }

      // If setting doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        const { data: newSetting, error: insertError } = await supabase
          .from('system_settings')
          .insert({
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
            description: `Custom ${key} setting`,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return newSetting;
      }

      return data;
    });

    await Promise.all(updates);

    // Invalidate all caches so new settings take effect immediately
    invalidatePromptsCache();
    invalidateReplicateModelCache();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/[key] - Update a single setting
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, description } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('system_settings')
      .update({ 
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      // Setting doesn't exist, create it
      const { data: newSetting, error: insertError } = await supabase
        .from('system_settings')
        .insert({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          description: description || `Custom ${key} setting`,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Invalidate all caches so new settings take effect immediately
      invalidatePromptsCache();
      invalidateReplicateModelCache();

      return NextResponse.json({ setting: newSetting });
    }

    if (error) {
      throw error;
    }

    // Invalidate all caches so new settings take effect immediately
    invalidatePromptsCache();
    invalidateReplicateModelCache();

    return NextResponse.json({ setting: data });
  } catch (error: any) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
