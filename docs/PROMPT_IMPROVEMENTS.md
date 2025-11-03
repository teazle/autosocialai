# Prompt Engineering Improvements

## Analysis: Current Implementation vs Best Practices

### ✅ What You're Doing Well

1. **Using JSON mode for structured output** - Good practice for Groq
2. **Negative prompts for image generation** - Critical for quality control
3. **Custom prompt templates** - Allows brand customization
4. **Temperature setting (0.7)** - Appropriate for creative content
5. **Feedback loop integration** - Smart use of validation feedback

---

## 🚨 Critical Issues & Improvements

### 1. **GROQ: Missing System Messages**

**Current Issue:**
- You're only using `role: 'user'` messages
- Missing system prompts that define the AI's behavior and persona

**Best Practice from Groq:**
- System prompts improve consistency and output quality
- They set the AI's role, personality, and instructions

**Recommended Fix:**

```typescript
// Add system message before user message
messages: [
  {
    role: 'system',
    content: `You are an expert social media content creator specializing in ${input.industry || 'various industries'}. 
You create engaging, ${input.brandVoice.toLowerCase()} content that resonates with ${input.targetAudience || 'target audiences'}. 
Your content is always brand-aligned, platform-optimized, and designed to maximize engagement.`
  },
  {
    role: 'user',
    content: prompt,
  }
]
```

### 2. **GROQ: Prompt Structure Could Be More Structured**

**Current:**
- Single long prompt string
- Instructions mixed with data

**Best Practice:**
- Use clear sections with delimiters
- Separate context from instructions
- Use formatting for better parsing

**Recommended Structure:**

```typescript
const systemPrompt = `You are an expert social media content creator...`;

const userPrompt = `
## Brand Context
- Brand Name: ${input.brandName}
- Brand Voice: ${input.brandVoice}
${input.companyDescription ? `- Company Description: ${input.companyDescription}` : ''}
${input.industry ? `- Industry: ${input.industry}` : ''}
${input.targetAudience ? `- Target Audience: ${input.targetAudience}` : ''}

## Content Requirements
- Hook: A punchy, curiosity-driven hook (max 12 words) that creates urgency
- Instagram Caption: 120-200 words with 5-10 relevant hashtags, engaging storytelling
- Facebook Caption: 80-120 words, community-focused, conversational tone
- TikTok Caption: Max 60 words, energetic, trending language, hashtag-friendly

## Additional Context
${input.topic ? `- Topic: ${input.topic}` : ''}
${input.keywords ? `- Keywords to incorporate: ${input.keywords.join(', ')}` : ''}

## Output Format
Return a JSON object with this exact structure:
{
  "hook": "...",
  "caption_ig": "...",
  "caption_fb": "...",
  "caption_tt": "..."
}
`;
```

### 3. **GROQ: Consider Using Groq SDK Instead of Direct Axios**

**Current:**
- Using axios directly (works, but less optimal)

**Best Practice:**
- Use official SDKs for better error handling, retries, and type safety

**Benefits:**
- Built-in retry logic
- Better error types
- Type safety
- Auto-retry on 429/500 errors

### 4. **REPLICATE: Prompt Optimization**

**Current Issue:**
- Prompts could be more descriptive
- Missing some technical details that improve image quality

**Best Practice for FLUX Models:**
- Be specific about composition, lighting, style
- Include technical quality terms
- Structure prompts: subject → setting → style → quality

**Recommended Structure:**

```
[Main Subject] + [Setting/Context] + [Style Details] + [Technical Quality] + [Color Palette] + [Composition]
```

**Example Improvement:**

```typescript
// Instead of:
prompt = `Premium social media ad visual for ${input.brandName}...`

// Use:
prompt = `${input.hook} | Brand: ${input.brandName}${input.industry ? ` | Industry: ${input.industry}` : ''}
Setting: Modern, professional social media advertising environment
Style: ${getStyleForBrandVoice(input.brandVoice)}, editorial photography, magazine-quality
Technical: Ultra high resolution, sharp focus, professional lighting, studio quality
${input.brandColors ? `Colors: ${input.brandColors.join(', ')}, cohesive color palette` : 'Colors: Modern, vibrant'}
Composition: Balanced, eye-catching, optimized for social media feed, clear focal point`
```

### 5. **GROQ: Temperature Settings Could Be Tuned**

**Current:**
- Fixed 0.7 for all content

**Best Practice:**
- Hook: Lower temperature (0.4-0.6) for consistency
- Captions: Current 0.7 is good for creativity
- Could add `max_tokens` to prevent overly long outputs

### 6. **REPLICATE: Negative Prompt Enhancement**

**Current:** ✅ Good base, but could be more structured

**Improvement:**
- Organize negative prompts by category
- Ensure proper comma separation
- Add industry-specific exclusions

---

## 📋 Implementation Recommendations

### Priority 1: Add System Messages to Groq (High Impact)

**File:** `lib/ai/groq.ts`

```typescript
const systemMessage = {
  role: 'system',
  content: buildSystemPrompt(input)
};

const messages = [systemMessage, { role: 'user', content: prompt }];
```

### Priority 2: Restructure Prompts with Clear Sections

**File:** `lib/ai/groq.ts` & `lib/ai/replicate.ts`

Use markdown-style formatting with clear sections:
- `## Brand Context`
- `## Requirements`
- `## Output Format`

### Priority 3: Enhance Image Prompts with Style Keywords

**File:** `lib/ai/replicate.ts`

Add specific style modifiers based on brand voice:
- Friendly → "warm, approachable, inviting"
- Premium → "luxury, sophisticated, refined"
- Bold → "dynamic, striking, confident"

### Priority 4: Consider Using Groq SDK

**Optional but Recommended:**

```bash
npm install groq-sdk
```

Benefits: Better error handling, retries, type safety.

---

## ✅ Specific Code Improvements

See implementation files in the next section for complete examples.

