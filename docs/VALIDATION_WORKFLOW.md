# Content Validation Workflow

## Overview

After content is generated, it goes through AI validation. This document explains what happens after validation and how the system determines next steps.

## Validation Process

### 1. Content Generation
- Content is generated (hook + captions for IG/FB/TikTok)
- Image is generated via Replicate

### 2. AI Validation (`validateContent`)
The AI editor validates:
- **Image Quality**: Checks for gibberish text, readable text, professional standards
- **Text Quality**: Grammar, spelling, engagement potential, brand alignment
- **Length**: Flexible guidelines (see below) - length alone should NOT cause rejection

### 3. Validation Results

The validation returns:
- `approved`: boolean (true/false)
- `issues`: array of issues found
- `details.overallScore`: 0-100 score
- `details.contentQuality`: "high" | "medium" | "low"

### 4. Validation Status Assignment

Based on validation results, posts get a `validation_status`:

| Score Range | Validation Status | What Happens |
|-------------|------------------|--------------|
| Score ≥ 85 AND approved = true | `approved` | ✅ Can be published automatically |
| Score 50-84 OR approved = false (but score ≥ 50) | `manual_review` | ⚠️ Needs admin approval before publishing |
| Score < 50 OR has critical issues (gibberish, errors) | `rejected` | ❌ Blocked from publishing |

### 5. Post Status Update

After validation:
- `status` becomes `generated`
- `validation_status` is set (see above)
- `validation_result` stores the score and quality details
- `validation_issues` stores any issues found

## What Happens Next

### Scenario 1: Validation Status = `approved`
1. **Automatic Publishing**:
   - Post waits for scheduled time
   - Worker checks for due posts (`check-due-posts.ts`)
   - If `status = 'pending'` AND `validation_status = 'approved'`, posts automatically
   - After successful publish, `status = 'published'`

2. **Manual Publishing**:
   - Admin can click "Publish Now" in Composer
   - System re-validates (final check)
   - If still approved, publishes immediately
   - `status = 'published'`

### Scenario 2: Validation Status = `manual_review`
1. **Blocked from Auto-Publishing**:
   - Worker skips posts with `validation_status = 'manual_review'`
   - Posts are NOT published automatically

2. **Admin Can Review**:
   - Admin sees posts in Pipeline with "manual review" indicator
   - Admin can:
     - Edit content (via Composer)
     - Approve manually (changes validation_status to 'approved')
     - Regenerate content
     - Delete post

3. **Manual Publish After Review**:
   - Admin edits/approves post
   - Clicks "Publish Now"
   - System re-validates
   - If approved, publishes

### Scenario 3: Validation Status = `rejected`
1. **Completely Blocked**:
   - Auto-publishing: Blocked
   - Manual publishing: Blocked (requires regeneration or approval)

2. **Admin Actions**:
   - **Regenerate Content**: Click regenerate button → generates new content → re-validates
   - **Regenerate Image**: Click regenerate image → generates new image → re-validates
   - **Manual Override**: (If implemented) Admin can override rejection

## Regenerate Content Button

The "Regenerate Content" button (`/api/pipeline/[postId]/regenerate-content`):
1. Uses previous validation issues as feedback
2. Generates new content with feedback
3. Validates new content
4. Updates `validation_status` based on new results
5. Updates `status` to `generated`

**Note**: Only regenerates text/captions, keeps existing image.

## Length Guidelines (Flexible)

### Current Guidelines (2024):
- **Instagram**: 100-250 words ideal (75-300 acceptable)
- **Facebook**: 40-150 words ideal (25-200 acceptable)  
- **TikTok**: 25-100 words ideal (15-150 acceptable)

### Important:
- Length is a **suggestion**, not a blocker
- Only flags length if extremely short (<20 words for IG) or very long (>500 words)
- Content quality > length compliance
- Editor should suggest length improvements, not reject for length alone

## Improving Validation Results

If content is frequently rejected or needs manual review:

1. **Check Generation Prompts**:
   - Review prompts in `/admin/settings`
   - Ensure prompts align with validation criteria

2. **Review Validation Feedback**:
   - Check `validation_issues` in database
   - Common issues: grammar, engagement, brand alignment

3. **Regenerate with Feedback**:
   - Use regenerate button
   - System uses previous issues to improve new content

4. **Adjust Brand Assets**:
   - Update brand voice if needed
   - Add more context in brand assets

## Database Fields

Relevant fields in `content_pipeline` table:
- `validation_status`: 'approved' | 'manual_review' | 'rejected' | null
- `validation_result`: JSON with score, quality details
- `validation_issues`: Array of issue strings
- `validated_at`: Timestamp of last validation
- `status`: 'pending' | 'generated' | 'published' | 'failed'

