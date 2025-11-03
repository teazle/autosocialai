# Testing Post Generation

## Quick Test Options

### Option 1: Use the API Endpoint (Recommended)

1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

2. **Test using curl:**
   ```bash
   curl -X POST http://localhost:3000/api/generate-posts \
     -H "Content-Type: application/json" \
     -d '{"clientId": "8e3ee4da-811a-4928-8757-02934421c53b"}'
   ```

   Or use the "Teazle" client (already has content rules):
   ```bash
   curl -X POST http://localhost:3000/api/generate-posts \
     -H "Content-Type: application/json" \
     -d '{"clientId": "8e3ee4da-811a-4928-8757-02934421c53b"}' \
     | jq
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Generated 1 post(s)",
     "postsCreated": 1
   }
   ```

### Option 2: Use the UI (Easiest)

1. Navigate to: `http://localhost:3000/clients/8e3ee4da-811a-4928-8757-02934421c53b/schedule`
2. Click "Generate Posts" button
3. Check the generated post in the pipeline

### Option 3: Run Test Script (Detailed Output)

1. **Install tsx if not already installed:**
   ```bash
   npm install -D tsx
   ```

2. **Run the test script:**
   ```bash
   npx tsx scripts/test-generate-post.ts
   ```

   Or with a specific client ID:
   ```bash
   npx tsx scripts/test-generate-post.ts 8e3ee4da-811a-4928-8757-02934421c53b
   ```

## Available Test Clients

- **Teazle** (Recommended for testing)
  - ID: `8e3ee4da-811a-4928-8757-02934421c53b`
  - Status: `active`
  - Brand Voice: `Premium`
  - Has content rules configured
  - Has brand assets (industry, target audience, colors, banned terms)

- **Test Company**
  - ID: `182a1a86-2ef9-4d59-a8d8-eb8bf05580f8`
  - Status: `pending` (needs to be set to `active`)

## What the Test Checks

✅ **Improved Prompt Engineering:**
- System messages (Groq)
- Structured prompts with clear sections
- Industry context utilization
- Target audience context utilization
- Style keywords for images

✅ **Content Generation:**
- Hook generation
- Platform-specific captions (IG, FB, TikTok)
- Length compliance
- Brand voice alignment

✅ **Image Generation:**
- FLUX model with improved prompts
- Negative prompts (banned terms)
- Industry/audience style keywords
- Custom prompt templates

✅ **Validation:**
- Content quality scoring
- Image quality checks
- Brand alignment verification

## View Results

After generating, check the results:

```sql
-- View latest generated post
SELECT 
  id,
  hook,
  LEFT(caption_ig, 50) as ig_preview,
  LEFT(caption_fb, 50) as fb_preview,
  image_url,
  validation_status,
  validation_result->>'overallScore' as score,
  created_at
FROM content_pipeline
WHERE client_id = '8e3ee4da-811a-4928-8757-02934421c53b'
ORDER BY created_at DESC
LIMIT 1;
```

## Troubleshooting

### "Client not found or content rules not set"
- Make sure the client has status = 'active'
- Make sure content_rules exist for the client

### "GROQ_API_KEY is not configured"
- Check your `.env` file has `GROQ_API_KEY`

### "REPLICATE_API_TOKEN is not configured"
- Check your `.env` file has `REPLICATE_API_TOKEN`

### Timeout errors
- Image generation can take 10-30 seconds
- Be patient, especially on first run

