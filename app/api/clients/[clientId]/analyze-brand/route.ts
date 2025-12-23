import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { analyzeBrand, BrandAnalysis } from '@/lib/ai/brand-analyzer';

/**
 * POST /api/clients/[clientId]/analyze-brand
 * Triggers AI brand analysis for a client
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await context.params;
        const supabase = createServiceRoleClient();

        // Fetch client and brand assets
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('name')
            .eq('id', clientId)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const { data: brandAssets, error: assetsError } = await supabase
            .from('brand_assets')
            .select('website_url, instagram_url, youtube_url, brand_pdf_url, color_hex')
            .eq('client_id', clientId)
            .maybeSingle();

        if (assetsError) {
            return NextResponse.json({ error: 'Failed to fetch brand assets' }, { status: 500 });
        }

        // Check if there's anything to analyze
        if (!brandAssets?.website_url && !brandAssets?.instagram_url &&
            !brandAssets?.youtube_url && !brandAssets?.brand_pdf_url) {
            return NextResponse.json({
                error: 'No sources to analyze. Please add a website URL, social media link, or PDF.'
            }, { status: 400 });
        }

        // Run brand analysis
        const analysis: BrandAnalysis = await analyzeBrand({
            websiteUrl: brandAssets.website_url || undefined,
            instagramUrl: brandAssets.instagram_url || undefined,
            youtubeUrl: brandAssets.youtube_url || undefined,
            pdfUrl: brandAssets.brand_pdf_url || undefined,
            existingColors: brandAssets.color_hex || [],
            brandName: client.name,
        });

        // Save analysis to brand_assets
        const { error: updateError } = await supabase
            .from('brand_assets')
            .update({ ai_analysis: analysis })
            .eq('client_id', clientId);

        if (updateError) {
            console.error('Failed to save analysis:', updateError);
            return NextResponse.json({
                error: 'Analysis completed but failed to save',
                analysis
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            analysis,
            message: 'Brand analysis completed successfully'
        });
    } catch (error: any) {
        console.error('Brand analysis error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to analyze brand'
        }, { status: 500 });
    }
}

/**
 * GET /api/clients/[clientId]/analyze-brand
 * Returns the current brand analysis
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await context.params;
        const supabase = createServiceRoleClient();

        const { data: brandAssets, error } = await supabase
            .from('brand_assets')
            .select('ai_analysis')
            .eq('client_id', clientId)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch brand analysis' }, { status: 500 });
        }

        return NextResponse.json({
            analysis: brandAssets?.ai_analysis || null
        });
    } catch (error: any) {
        console.error('Error fetching brand analysis:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
