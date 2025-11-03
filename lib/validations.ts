import { z } from 'zod';

// Client schemas
export const createClientSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  brand_voice: z.enum(['Friendly', 'Premium', 'Bold', 'Luxury']),
  timezone: z.string(),
  industry: z.string().optional(),
  target_audience: z.string().optional(),
});

export const brandRulesSchema = z.object({
  brand_voice: z.enum(['Friendly', 'Premium', 'Bold', 'Luxury']),
  industry: z.string().optional(),
  target_audience: z.string().optional(),
  banned_terms: z.array(z.string()),
  colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')),
  ctas: z.array(z.string()),
});

export const scheduleSchema = z.object({
  posts_per_week: z.number().min(1).max(7),
  posting_days: z.array(z.number().min(0).max(6)),
  posting_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Must be valid HH:MM format'),
  timezone: z.string(),
});

export const composerSchema = z.object({
  hook: z.string().max(80, 'Hook must be max 80 characters'),
  caption_ig: z.string().min(50, 'Instagram caption must be at least 50 words'),
  caption_fb: z.string().min(40, 'Facebook caption must be at least 40 words'),
  caption_tt: z.string().max(300, 'TikTok caption must be max 300 characters'),
  image_url: z.string().url().optional(),
  scheduled_at: z.string().datetime(),
  platforms: z.array(z.enum(['facebook', 'instagram', 'tiktok'])).min(1, 'Select at least one platform'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type BrandRulesInput = z.infer<typeof brandRulesSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type ComposerInput = z.infer<typeof composerSchema>;

