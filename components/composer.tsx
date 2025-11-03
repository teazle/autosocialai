'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Instagram, Facebook, Music, Image as ImageIcon, RefreshCw, Upload, MessageSquare } from 'lucide-react';
import { ContentPipeline } from '@/lib/types/database';
import { useToast } from '@/components/ui/toast';

interface ComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: ContentPipeline;
  clientId: string;
}

export function Composer({ open, onOpenChange, post, clientId }: ComposerProps) {
  const toast = useToast();
  const [activePreview, setActivePreview] = useState<'fb' | 'ig' | 'tt'>('ig');
  const [hook, setHook] = useState(post?.hook || '');
  const [captionIg, setCaptionIg] = useState(post?.caption_ig || '');
  const [captionFb, setCaptionFb] = useState(post?.caption_fb || '');
  const [captionTt, setCaptionTt] = useState(post?.caption_tt || '');
  const [imageUrl, setImageUrl] = useState(post?.image_url || '');
  const [imageModel, setImageModel] = useState(post?.image_model || '');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<('facebook' | 'instagram' | 'tiktok')[]>(
    post ? ['facebook', 'instagram', 'tiktok'] : ['instagram']
  );
  const [scheduledAt, setScheduledAt] = useState(post?.scheduled_at || '');
  const [editorComments, setEditorComments] = useState(post?.editor_comments || '');
  const [regeneratingImage, setRegeneratingImage] = useState(false);

  // Update form fields when post changes (for editing)
  useEffect(() => {
    if (post) {
      setHook(post.hook || '');
      setCaptionIg(post.caption_ig || '');
      setCaptionFb(post.caption_fb || '');
      setCaptionTt(post.caption_tt || '');
      setImageUrl(post.image_url || '');
      setImageModel(post.image_model || '');
      setEditorComments(post.editor_comments || '');
      setSelectedPlatforms(['facebook', 'instagram', 'tiktok']);
      // Format scheduled_at for datetime-local input (YYYY-MM-DDTHH:mm)
      if (post.scheduled_at) {
        const date = new Date(post.scheduled_at);
        const formatted = date.toISOString().slice(0, 16); // Remove seconds and timezone
        setScheduledAt(formatted);
      } else {
        setScheduledAt('');
      }
    } else {
      // Reset form when creating new post
      setHook('');
      setCaptionIg('');
      setCaptionFb('');
      setCaptionTt('');
      setImageUrl('');
      setEditorComments('');
      setSelectedPlatforms(['instagram']);
      setScheduledAt('');
    }
  }, [post]);

  const platformConfig = {
    fb: { icon: Facebook, name: 'Facebook', color: 'text-blue-600' },
    ig: { icon: Instagram, name: 'Instagram', color: 'text-purple-600' },
    tt: { icon: Music, name: 'TikTok', color: 'text-pink-600' },
  };

  const currentConfig = platformConfig[activePreview];

  const handleRegenerateImage = async () => {
    if (!post?.id) {
      toast({ title: 'Save first', description: 'Cannot regenerate image for a new post. Save it first.', variant: 'destructive' });
      return;
    }

    setRegeneratingImage(true);
    try {
      const response = await fetch(`/api/pipeline/${post.id}/regenerate-image`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Update the local image URL and model to show the new image immediately
        if (result.image_url) {
          setImageUrl(result.image_url);
        }
        if (result.image_model) {
          setImageModel(result.image_model);
        }
        toast({ title: 'Image regenerated', description: 'New image has been generated for this post.', variant: 'success' });
      } else {
        if (result.paymentRequired) {
          toast({ title: 'Payment required', description: result.message || 'Replicate credits needed for image generation.', variant: 'warning' });
        } else {
          toast({ title: 'Image generation failed', description: result.error || 'Could not generate image.', variant: 'destructive' });
        }
      }
    } catch (error: any) {
      console.error('Error regenerating image:', error);
      toast({ title: 'Image generation failed', description: error.message || 'Please try again later.', variant: 'destructive' });
    } finally {
      setRegeneratingImage(false);
    }
  };

  const handleUploadImage = () => {
    // TODO: Implement image upload
    console.log('Uploading image...');
  };

  const handleSave = async () => {
    try {
      if (post?.id) {
        // Update existing post
        const response = await fetch(`/api/pipeline/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hook,
            caption_ig: captionIg,
            caption_fb: captionFb,
            caption_tt: captionTt,
            image_url: imageUrl,
            scheduled_at: scheduledAt,
            platforms: selectedPlatforms,
            editor_comments: editorComments,
          }),
        });

        if (!response.ok) throw new Error('Failed to save');
      } else {
        // Create new post
        const response = await fetch(`/api/clients/${clientId}/pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hook,
            caption_ig: captionIg,
            caption_fb: captionFb,
            caption_tt: captionTt,
            image_url: imageUrl,
            scheduled_at: scheduledAt,
            status: 'pending',
          }),
        });

        if (!response.ok) throw new Error('Failed to create');
      }

      onOpenChange(false);
      toast({ title: 'Post saved', description: 'Your changes have been saved successfully.', variant: 'success' });
    } catch (error) {
      console.error('Error saving post:', error);
      toast({ title: 'Failed to save', description: 'Could not save the post. Please try again.', variant: 'destructive' });
    }
  };

  const handleApprove = async () => {
    try {
      if (!post?.id) {
        toast({ title: 'Save first', description: 'Cannot approve a new post. Save it first.', variant: 'destructive' });
        return;
      }

      const response = await fetch(`/api/pipeline/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });

      if (!response.ok) throw new Error('Failed to approve');
      onOpenChange(false);
      toast({ title: 'Post approved', description: 'The post has been marked as approved.', variant: 'success' });
    } catch (error) {
      console.error('Error approving post:', error);
      toast({ title: 'Failed to approve', description: 'Could not approve the post. Please try again.', variant: 'destructive' });
    }
  };

  const handlePublishNow = async () => {
    try {
      if (!post?.id) {
        toast({ title: 'Save first', description: 'Cannot publish a new post. Save it first.', variant: 'destructive' });
        return;
      }

      const response = await fetch(`/api/pipeline/${post.id}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish');
      }

      onOpenChange(false);
      toast({ title: 'Published', description: 'Your post has been published to social media.', variant: 'success' });
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({ title: 'Failed to publish', description: error instanceof Error ? error.message : 'Could not publish the post.', variant: 'destructive' });
    }
  };

  const togglePlatform = (platform: 'facebook' | 'instagram' | 'tiktok') => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const getCaption = () => {
    switch (activePreview) {
      case 'ig': return captionIg;
      case 'fb': return captionFb;
      case 'tt': return captionTt;
    }
  };

  const CurrentConfig = platformConfig[activePreview];
  const CurrentIcon = CurrentConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Post' : 'Create New Post'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold">Preview</h3>
            
            {/* Platform Toggle */}
            <div className="flex gap-2">
              {(['fb', 'ig', 'tt'] as const).map((platform) => {
                const { icon: Icon, name } = platformConfig[platform];
                return (
                  <Button
                    key={platform}
                    variant={activePreview === platform ? 'default' : 'outline'}
                    onClick={() => setActivePreview(platform)}
                    className="flex-1"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {name}
                  </Button>
                );
              })}
            </div>

            {/* Preview Card */}
            <div className="border border-gray-200 rounded-lg bg-white">
              {imageUrl && (
                <div className="w-full aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                  <img 
                    src={imageUrl} 
                    alt="Post" 
                    className="w-full h-full object-cover"
                    key={imageUrl} 
                  />
                  {imageModel && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-black/70 text-white border-none">
                        {imageModel.includes('ideogram') ? 'Ideogram' : imageModel.includes('flux-1.1-pro') ? 'FLUX Pro' : imageModel.includes('flux-schnell') ? 'FLUX Schnell' : imageModel.split('/').pop()}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CurrentIcon className="w-4 h-4" />
                  <span className={CurrentConfig.color}>{CurrentConfig.name}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{getCaption()}</p>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="space-y-4">
            <h3 className="font-semibold">Content</h3>

            {/* Hook */}
            <div>
              <Label htmlFor="hook">Hook (Max 12 words)</Label>
              <Input
                id="hook"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="Attention-grabbing hook"
                maxLength={80}
              />
              <p className="text-xs text-gray-500 mt-1">{hook.split(' ').length}/12 words</p>
            </div>

            {/* Captions */}
            <Tabs defaultValue="ig">
              <TabsList>
                <TabsTrigger value="ig">Instagram</TabsTrigger>
                <TabsTrigger value="fb">Facebook</TabsTrigger>
                <TabsTrigger value="tt">TikTok</TabsTrigger>
              </TabsList>
              <TabsContent value="ig">
                <Label htmlFor="captionIg">Instagram Caption (120-200 words)</Label>
                <Textarea
                  id="captionIg"
                  className="min-h-[200px]"
                  value={captionIg}
                  onChange={(e) => setCaptionIg(e.target.value)}
                  placeholder="Write your Instagram caption..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {captionIg.split(/\s+/).filter(w => w).length} words
                </p>
              </TabsContent>
              <TabsContent value="fb">
                <Label htmlFor="captionFb">Facebook Caption (80-120 words)</Label>
                <Textarea
                  id="captionFb"
                  className="min-h-[200px]"
                  value={captionFb}
                  onChange={(e) => setCaptionFb(e.target.value)}
                  placeholder="Write your Facebook caption..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {captionFb.split(/\s+/).filter(w => w).length} words
                </p>
              </TabsContent>
              <TabsContent value="tt">
                <Label htmlFor="captionTt">TikTok Caption (≤60 words)</Label>
                <Textarea
                  id="captionTt"
                  className="min-h-[150px]"
                  value={captionTt}
                  onChange={(e) => setCaptionTt(e.target.value)}
                  placeholder="Write your TikTok caption..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {captionTt.split(/\s+/).filter(w => w).length} words
                </p>
              </TabsContent>
            </Tabs>

            {/* Image */}
            <div>
              <Label>Image</Label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={handleRegenerateImage} className="flex-1" disabled={regeneratingImage}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${regeneratingImage ? 'animate-spin' : ''}`} />
                  {regeneratingImage ? 'Generating...' : 'Regenerate'}
                </Button>
                <Button variant="outline" onClick={handleUploadImage} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
              {imageModel && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Model: {imageModel.includes('ideogram') ? 'Ideogram' : imageModel.includes('flux-1.1-pro') ? 'FLUX 1.1 Pro' : imageModel.includes('flux-schnell') ? 'FLUX Schnell' : imageModel}
                  </Badge>
                </div>
              )}
              {!imageUrl && (
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">No image uploaded</p>
                </div>
              )}
            </div>

            {/* Platforms */}
            <div>
              <Label>Platforms</Label>
              <div className="flex gap-2 mt-2">
                {(['facebook', 'instagram', 'tiktok'] as const).map((platform) => {
                  const Icon = platformConfig[platform === 'facebook' ? 'fb' : platform === 'instagram' ? 'ig' : 'tt'].icon;
                  return (
                    <Badge
                      key={platform}
                      variant={selectedPlatforms.includes(platform) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => togglePlatform(platform)}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'TikTok'}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Scheduled Time */}
            <div>
              <Label htmlFor="scheduledAt">Scheduled Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>

            {/* Editor Comments */}
            <div>
              <Label htmlFor="editorComments" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Editor Comments
                <span className="text-xs text-gray-500 font-normal">(for regeneration)</span>
              </Label>
              <Textarea
                id="editorComments"
                className="min-h-[100px]"
                value={editorComments}
                onChange={(e) => setEditorComments(e.target.value)}
                placeholder="Add feedback or instructions for AI regeneration (e.g., 'Make the hook more energetic', 'Focus on sustainability benefits', 'Use more emojis')"
              />
              <p className="text-xs text-gray-500 mt-1">
                These comments will be used to guide content regeneration
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSave}>
            Save as Draft
          </Button>
          <Button onClick={handleApprove}>
            Approve
          </Button>
          <Button variant="destructive" onClick={handlePublishNow}>
            Publish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

