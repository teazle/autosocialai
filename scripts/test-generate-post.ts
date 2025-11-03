/**
 * Test Script: Generate a Single Post
 * 
 * This script tests the improved prompt engineering by generating one post
 * for the active client.
 * 
 * Usage:
 *   npx tsx scripts/test-generate-post.ts [clientId]
 * 
 * Or if no clientId provided, uses "Teazle" client by default
 */

import { createServiceRoleClient } from '../lib/supabase/server';
import { generateContent as generateAI } from '../lib/ai/groq';
import { generateImage } from '../lib/ai/replicate';
import { validateContent } from '../lib/ai/editor';

// Default test client (Teazle - active with content rules)
const DEFAULT_CLIENT_ID = '8e3ee4da-811a-4928-8757-02934421c53b';

async function testGeneratePost(clientId?: string) {
  console.log('🧪 Testing Post Generation with Improved Prompts\n');
  console.log('='.repeat(60));

  const supabase = createServiceRoleClient();
  const targetClientId = clientId || DEFAULT_CLIENT_ID;

  try {
    // Step 1: Get client info
    console.log('\n📋 Step 1: Fetching client data...');
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*, content_rules!inner(*)')
      .eq('id', targetClientId)
      .single();

    if (clientError || !client) {
      throw new Error(`Client not found: ${clientError?.message || 'Unknown error'}`);
    }

    console.log(`✅ Client: ${client.name}`);
    console.log(`   Brand Voice: ${client.brand_voice}`);
    console.log(`   Status: ${client.status}`);
    console.log(`   Posts per week: ${client.content_rules.posts_per_week}`);

    // Step 2: Get brand assets
    console.log('\n🎨 Step 2: Fetching brand assets...');
    let brandAssets = null;
    try {
      const { data } = await supabase
        .from('brand_assets')
        .select('*')
        .eq('client_id', targetClientId)
        .maybeSingle();
      brandAssets = data;

      if (brandAssets) {
        console.log(`✅ Brand Assets Found:`);
        console.log(`   Industry: ${brandAssets.industry || 'Not set'}`);
        console.log(`   Target Audience: ${brandAssets.target_audience || 'Not set'}`);
        console.log(`   Colors: ${brandAssets.color_hex?.length || 0} color(s)`);
        console.log(`   Banned Terms: ${brandAssets.banned_terms?.length || 0} term(s)`);
      } else {
        console.log('⚠️  No brand assets found - using defaults');
      }
    } catch (error) {
      console.log('⚠️  Error fetching brand assets (continuing with defaults)');
    }

    // Step 3: Generate content
    console.log('\n✍️  Step 3: Generating content with improved prompts...');
    console.log('   (Using system messages, structured prompts, industry/audience context)');
    
    const startTime = Date.now();
    const content = await generateAI({
      brandName: client.name,
      brandVoice: client.brand_voice,
      companyDescription: client.company_description,
      industry: brandAssets?.industry,
      targetAudience: brandAssets?.target_audience,
    });
    const contentTime = Date.now() - startTime;

    console.log(`✅ Content generated in ${contentTime}ms`);
    console.log(`\n📝 Generated Content:`);
    console.log(`   Hook: "${content.hook}"`);
    console.log(`   IG Caption: ${content.caption_ig?.length || 0} chars`);
    console.log(`   FB Caption: ${content.caption_fb?.length || 0} chars`);
    console.log(`   TikTok Caption: ${content.caption_tt?.length || 0} chars`);

    // Step 4: Generate image
    console.log('\n🖼️  Step 4: Generating image with improved prompts...');
    console.log('   (Using structured prompts, style keywords, industry/audience context)');
    
    const imageStartTime = Date.now();
    const imageUrl = await generateImage({
      hook: content.hook,
      brandName: client.name,
      brandColors: brandAssets?.color_hex,
      bannedTerms: brandAssets?.banned_terms,
      industry: brandAssets?.industry,
      targetAudience: brandAssets?.target_audience,
      customPromptTemplate: brandAssets?.image_prompt_template,
      customNegativePromptTemplate: brandAssets?.negative_prompt_template,
    });
    const imageTime = Date.now() - imageStartTime;

    console.log(`✅ Image generated in ${imageTime}ms`);
    console.log(`   Image URL: ${imageUrl}`);

    // Step 5: Validate content
    console.log('\n✅ Step 5: Validating content quality...');
    
    const validationStartTime = Date.now();
    const validationResult = await validateContent({
      hook: content.hook,
      caption_ig: content.caption_ig,
      caption_fb: content.caption_fb,
      caption_tt: content.caption_tt,
      image_url: imageUrl,
      brandName: client.name,
    });
    const validationTime = Date.now() - validationStartTime;

    console.log(`✅ Validation completed in ${validationTime}ms`);
    console.log(`\n📊 Validation Results:`);
    console.log(`   Score: ${validationResult.details.overallScore}/100`);
    console.log(`   Quality: ${validationResult.details.contentQuality}`);
    console.log(`   Approved: ${validationResult.approved ? '✅ YES' : '❌ NO'}`);
    
    if (validationResult.issues && validationResult.issues.length > 0) {
      console.log(`\n⚠️  Issues Found (${validationResult.issues.length}):`);
      validationResult.issues.slice(0, 5).forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${typeof issue === 'string' ? issue : JSON.stringify(issue)}`);
      });
    } else {
      console.log(`\n✅ No issues found!`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Content Generation: ${contentTime}ms`);
    console.log(`✅ Image Generation: ${imageTime}ms`);
    console.log(`✅ Validation: ${validationTime}ms`);
    console.log(`✅ Total Time: ${Date.now() - startTime}ms`);
    console.log(`✅ Final Status: ${validationResult.approved ? 'APPROVED' : 'NEEDS REVIEW'}`);
    
    console.log('\n📝 Full Content Preview:');
    console.log('─'.repeat(60));
    console.log(`HOOK: ${content.hook}`);
    console.log('\nINSTAGRAM:');
    console.log(content.caption_ig?.substring(0, 200) + '...');
    console.log('\nFACEBOOK:');
    console.log(content.caption_fb?.substring(0, 150) + '...');
    console.log('\nTIKTOK:');
    console.log(content.caption_tt);

    console.log('\n✅ Test completed successfully!');
    console.log(`\n💡 Tips:`);
    console.log(`   - Check the generated content quality above`);
    console.log(`   - The improved prompts now use system messages and structured formatting`);
    console.log(`   - Industry and audience context are now being utilized`);
    console.log(`   - Review the image at: ${imageUrl}`);

    return {
      success: true,
      content,
      imageUrl,
      validationResult,
      timings: {
        content: contentTime,
        image: imageTime,
        validation: validationTime,
        total: Date.now() - startTime,
      },
    };
  } catch (error: any) {
    console.error('\n❌ Error during test:');
    console.error(error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  const clientId = process.argv[2];
  testGeneratePost(clientId)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testGeneratePost };

