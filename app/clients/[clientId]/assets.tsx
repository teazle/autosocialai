'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';
import { ImageViewer } from '@/components/image-viewer';

interface AssetsTabProps {
  clientId: string;
}

export default function AssetsTab({ clientId }: AssetsTabProps) {
  const toast = useToast();
  const [assets, setAssets] = useState<string[]>([]);
  const [postsWithoutImages, setPostsWithoutImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchAssets();
  }, [clientId]);

  const fetchAssets = async () => {
    try {
      // Fetch images from content_pipeline
      const response = await fetch(`/api/clients/${clientId}/pipeline`);
      if (response.ok) {
        const data = await response.json();
        const posts = data.posts || [];
        
        // Extract image URLs from posts (only valid URLs)
        const imageUrls = posts
          .map((post: any) => post.image_url)
          .filter((url: string) => url && url.trim() !== '');
        setAssets(imageUrls);
        
        // Find posts without images
        const withoutImages = posts.filter((post: any) => !post.image_url || post.image_url.trim() === '');
        setPostsWithoutImages(withoutImages);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateMissingImages = async () => {
    if (postsWithoutImages.length === 0) {
      toast({ title: 'No missing images', description: 'All posts already have images.', variant: 'success' });
      return;
    }

    setRegenerating(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const post of postsWithoutImages) {
        try {
          const response = await fetch(`/api/pipeline/${post.id}/regenerate-image`, {
            method: 'POST',
          });
          
          const result = await response.json();
          
          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to regenerate image for post ${post.id}:`, result.error);
          }
        } catch (error: any) {
          failCount++;
          console.error(`Error regenerating image for post ${post.id}:`, error);
        }
      }

      // Refresh assets
      await fetchAssets();

      if (successCount > 0) {
        toast({ 
          title: 'Images regenerated', 
          description: `Successfully generated ${successCount} image(s). ${failCount > 0 ? `${failCount} failed.` : ''}`, 
          variant: 'success' 
        });
      } else {
        toast({ 
          title: 'Generation failed', 
          description: `Could not generate images. ${failCount > 0 ? 'Check Replicate payment status.' : ''}`, 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error in bulk regeneration:', error);
      toast({ title: 'Bulk regeneration failed', description: 'An error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading assets...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Images</CardTitle>
            <div className="flex gap-2">
              {postsWithoutImages.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={regenerateMissingImages}
                  disabled={regenerating}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  {regenerating ? 'Generating...' : `Generate ${postsWithoutImages.length} Missing`}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assets.length === 0 && postsWithoutImages.length === 0 ? (
            <div className="text-center py-12 text-gray-700">
              No assets yet. Assets will appear here once content is generated.
            </div>
          ) : (
            <div>
              {postsWithoutImages.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">
                          {postsWithoutImages.length} post{postsWithoutImages.length > 1 ? 's' : ''} missing images
                        </p>
                        <p className="text-xs text-yellow-700">
                          Click the button above to generate missing images
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {assets.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {assets.map((asset, index) => (
                    <div 
                      key={index} 
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setViewingImage(asset);
                      }}
                    >
                      <img 
                        src={asset} 
                        key={asset}
                        alt={`Generated asset ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No images available yet. Generate images using the button above.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ImageViewer
        open={!!viewingImage}
        onOpenChange={(open) => {
          if (!open) {
            setViewingImage(null);
            setCurrentImageIndex(0);
          }
        }}
        imageUrl={viewingImage}
        alt="Generated asset"
        images={assets.length > 0 ? assets : undefined}
        currentIndex={currentImageIndex}
        onIndexChange={(index) => {
          setCurrentImageIndex(index);
          setViewingImage(assets[index]);
        }}
      />
    </div>
  );
}

