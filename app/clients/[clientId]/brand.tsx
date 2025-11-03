'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BrandAssets, ContentRules } from '@/lib/types/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface BrandTabProps {
  clientId: string;
}

export default function BrandTab({ clientId }: BrandTabProps) {
  const [brandVoice, setBrandVoice] = useState('Friendly');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [bannedTerms, setBannedTerms] = useState<string[]>([]);
  const [newBannedTerm, setNewBannedTerm] = useState('');
  const [hashtagSets, setHashtagSets] = useState<{ name: string; tags: string[] }[]>([]);
  const [ctas, setCtas] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>(['']);
  const [imagePromptTemplate, setImagePromptTemplate] = useState('');
  const [negativePromptTemplate, setNegativePromptTemplate] = useState('');
  const [autoPublish, setAutoPublish] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchBrandData();
  }, [clientId]);

  const fetchBrandData = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        const client = data.client;
        
        if (client) {
          setBrandVoice(client.brand_voice || 'Friendly');
        }
      }

      // Try to fetch brand assets, but don't fail if they don't exist
      const supabase = createBrowserClient();
      const { data: assets, error } = await supabase
        .from('brand_assets')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      // Only update state if assets exist and there's no error
      if (assets && !error) {
        setColors(assets.color_hex && assets.color_hex.length > 0 ? assets.color_hex : ['']);
        setBannedTerms(assets.banned_terms || []);
        setImagePromptTemplate(assets.image_prompt_template || '');
        setNegativePromptTemplate(assets.negative_prompt_template || '');
        setIndustry(assets.industry || '');
        setTargetAudience(assets.target_audience || '');
      }
    } catch (error) {
      console.error('Error fetching brand data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      // Update brand assets (create if doesn't exist)
      const { error: assetsError } = await supabase
        .from('brand_assets')
        .upsert({
          client_id: clientId,
          color_hex: colors.filter(c => c),
          banned_terms: bannedTerms,
          image_prompt_template: imagePromptTemplate || null,
          negative_prompt_template: negativePromptTemplate || null,
          industry: industry || null,
          target_audience: targetAudience || null,
        }, {
          onConflict: 'client_id'
        });

      if (assetsError) {
        console.warn('Failed to save brand assets:', assetsError);
        // Don't throw, just log the warning
      }

      // Update client brand voice
      const { error: clientError } = await supabase
        .from('clients')
        .update({ brand_voice: brandVoice })
        .eq('id', clientId);

      if (clientError) throw clientError;

      toast({ title: 'Brand settings saved', description: 'Your brand configuration has been updated.', variant: 'success' });
    } catch (error) {
      console.error('Error saving brand data:', error);
      toast({ title: 'Failed to save', description: 'Could not update brand settings. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addBannedTerm = () => {
    if (newBannedTerm.trim()) {
      setBannedTerms([...bannedTerms, newBannedTerm.trim()]);
      setNewBannedTerm('');
    }
  };

  const removeBannedTerm = (index: number) => {
    setBannedTerms(bannedTerms.filter((_, i) => i !== index));
  };

  const addCta = () => {
    setCtas([...ctas, '']);
  };

  const removeCta = (index: number) => {
    setCtas(ctas.filter((_, i) => i !== index));
  };

  const updateCta = (index: number, value: string) => {
    const newCtas = [...ctas];
    newCtas[index] = value;
    setCtas(newCtas);
  };

  if (loading) {
    return <div className="text-center py-8">Loading brand settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Brand Voice */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Voice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {['Friendly', 'Premium', 'Bold', 'Luxury'].map((voice) => (
              <Button
                key={voice}
                variant={brandVoice === voice ? 'default' : 'outline'}
                onClick={() => setBrandVoice(voice)}
                className="w-full"
              >
                {voice}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry & Audience */}
      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Fashion, Tech, Food"
            />
          </div>
          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., Young professionals, 25-35"
            />
          </div>
        </CardContent>
      </Card>

      {/* Banned Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Banned Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newBannedTerm}
              onChange={(e) => setNewBannedTerm(e.target.value)}
              placeholder="Add banned term"
              onKeyPress={(e) => e.key === 'Enter' && addBannedTerm()}
            />
            <Button onClick={addBannedTerm}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {bannedTerms.map((term, index) => (
              <Badge key={index} variant="secondary" className="gap-2">
                {term}
                <button onClick={() => removeBannedTerm(index)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTAs */}
      <Card>
        <CardHeader>
          <CardTitle>Call-to-Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ctas.map((cta, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={cta}
                onChange={(e) => updateCta(index, e.target.value)}
                placeholder={`CTA ${index + 1}`}
              />
              <Button variant="destructive" size="icon" onClick={() => removeCta(index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addCta} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add CTA
          </Button>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {colors.map((color, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="color"
                value={color}
                onChange={(e) => {
                  const newColors = [...colors];
                  newColors[index] = e.target.value;
                  setColors(newColors);
                }}
                className="w-20"
              />
              <Input
                value={color}
                onChange={(e) => {
                  const newColors = [...colors];
                  newColors[index] = e.target.value;
                  setColors(newColors);
                }}
                placeholder="#000000"
              />
              <Button variant="destructive" size="icon" onClick={() => setColors(colors.filter((_, i) => i !== index))}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {colors.length < 4 && (
            <Button variant="outline" onClick={() => setColors([...colors, ''])} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Color
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Image Prompt Template */}
      <Card>
        <CardHeader>
          <CardTitle>Image Generation Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="imagePrompt">Custom Image Prompt Template</Label>
            <p className="text-sm text-gray-500 mb-2">
              Customize how AI generates images. Use placeholders: {'{hook}'}, {'{brandName}'}, {'{colors}'}
            </p>
            <textarea
              id="imagePrompt"
              className="w-full min-h-[120px] p-3 border rounded-md font-mono text-sm"
              value={imagePromptTemplate}
              onChange={(e) => setImagePromptTemplate(e.target.value)}
              placeholder={`Premium social media ad visual for {brandName}. Palette: {colors}. Idea from hook: "{hook}". Style: high-contrast, editorial, ad-quality, professional photography.`}
            />
            <p className="text-xs text-gray-400 mt-2">
              Leave empty to use default prompt. Current default: &quot;Premium social media ad visual for {'{brandName}'}. Palette: {'{colors}'}. Idea from hook: &quot;{'{hook}'}&quot;. Style: high-contrast, editorial, ad-quality, professional photography.&quot;
            </p>
          </div>
          <div>
            <Label htmlFor="negativePrompt">Custom Negative Prompt (Optional)</Label>
            <p className="text-sm text-gray-500 mb-2">
              Add additional terms the AI should avoid (comma-separated). This is <strong>combined</strong> with the system default negative prompt that already prevents common issues like gibberish, random characters, low quality, etc.
            </p>
            <textarea
              id="negativePrompt"
              className="w-full min-h-[100px] p-3 border rounded-md font-mono text-sm"
              value={negativePromptTemplate}
              onChange={(e) => setNegativePromptTemplate(e.target.value)}
              placeholder="e.g., cartoon style, retro look, dark themes, people faces"
            />
            <p className="text-xs text-gray-400 mt-2">
              <strong>How it works:</strong> Your custom terms will be added to the default system negative prompt. 
              The default already includes: watermark, text, typography, gibberish, random characters, foreign text, 
              low quality, blurry, distortion, bad anatomy, cluttered, messy, etc. 
              Use this field to add <strong>client-specific</strong> exclusions (e.g., &quot;no cartoon style&quot; for a premium brand).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-publish Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-publish</p>
              <p className="text-sm text-gray-500">Automatically publish posts when they're ready</p>
            </div>
            <Button
              variant={autoPublish ? 'default' : 'outline'}
              onClick={() => setAutoPublish(!autoPublish)}
            >
              {autoPublish ? 'ON' : 'OFF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

