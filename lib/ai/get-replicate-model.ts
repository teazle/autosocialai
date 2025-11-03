import { createServiceRoleClient } from '@/lib/supabase/server';
import { ReplicateModel } from './replicate';

// Cache for replicate model to reduce database queries
let modelCache: ReplicateModel | null = null;
let modelCacheTimestamp: number = 0;
const MODEL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get the global Replicate model setting from system_settings
 * Falls back to default if not set in database
 */
export async function getReplicateModel(): Promise<ReplicateModel> {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (modelCache && (now - modelCacheTimestamp) < MODEL_CACHE_TTL) {
    return modelCache;
  }

  try {
    const supabase = createServiceRoleClient();
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'replicate_model')
      .maybeSingle();
    
    if (error || !data?.value) {
      // Fall back to default
      const defaultModel: ReplicateModel = 'ideogram-ai/ideogram-v3-turbo';
      modelCache = defaultModel;
      modelCacheTimestamp = now;
      return defaultModel;
    }
    
    const model = data.value as ReplicateModel;
    
    // Validate it's a valid model
    const validModels: ReplicateModel[] = [
      'ideogram-ai/ideogram-v3-turbo',
      'black-forest-labs/flux-1.1-pro',
      'black-forest-labs/flux-schnell',
    ];
    
    if (validModels.includes(model)) {
      modelCache = model;
      modelCacheTimestamp = now;
      return model;
    }
    
    // Invalid model in database, return default
    const defaultModel: ReplicateModel = 'ideogram-ai/ideogram-v3-turbo';
    modelCache = defaultModel;
    modelCacheTimestamp = now;
    return defaultModel;
  } catch (error) {
    console.error('Error fetching replicate model from system settings:', error);
    // Return default on error
    const defaultModel: ReplicateModel = 'ideogram-ai/ideogram-v3-turbo';
    modelCache = defaultModel;
    modelCacheTimestamp = now;
    return defaultModel;
  }
}

/**
 * Invalidate the replicate model cache (call after updating settings)
 */
export function invalidateReplicateModelCache() {
  modelCache = null;
  modelCacheTimestamp = 0;
}

