# Image Text Detection & Gibberish Detection

## Overview

The editor AI can detect and analyze text within generated images to identify gibberish, random characters, or unreadable text. This is critical for maintaining content quality.

## How It Works

### 1. OCR (Optical Character Recognition)

The system uses multiple OCR methods with fallbacks:

**Primary Method**: Tesseract OCR (`daanelson/image-ocr`)
- Fast and reliable
- Good accuracy for clear text
- Extracts text directly from images

**Fallback Methods** (if primary fails):
1. LLaVA Vision Model (`yorickvp/llava-13b`)
   - Vision-language model that can analyze images
   - Can extract and describe text
   - Good for complex layouts

2. TrOCR (`microsoft/trocr-base-printed`)
   - Microsoft's Transformer-based OCR
   - Good for printed text

3. LLaVA Vicuna (`lucataco/llava-v1.6-vicuna`)
   - Alternative vision model
   - Last resort fallback

### 2. Text Analysis (Gibberish Detection)

After extracting text, Groq AI analyzes it to detect:

✅ **Readable Text** (Acceptable):
- Real English words: "Save 50% Today", "New Collection"
- Brand names: "Nike", "Coca-Cola"
- Stylized but readable: "SALE", "NEW ARRIVAL"
- Foreign languages (if intentional): "NUEVA COLECCIÓN"

❌ **Gibberish** (Rejected):
- Random characters: "asdfghjkl", "qwertyuiop"
- Scrambled text: "x7#kP@m9$qL"
- Encoding corruption: "Sav#@50% T@day!"
- Keyboard mashing: "jklmnopqrst"
- Repeated characters: "aaaaa", "xxxxx"

### 3. Detection Rules

The AI checks for:
- **Repeated random characters**: 5+ repeated chars (e.g., "aaaaa")
- **High special character ratio**: >50% special chars without words
- **Non-word patterns**: Letters that don't form words (e.g., "asdf")
- **Corrupted encoding**: Mix of random symbols and text

### 4. Validation Flow

```
Image Generated
    ↓
OCR Extraction (tries multiple methods)
    ↓
Text Extracted?
    ├─ No → Pass (no text in image is acceptable)
    └─ Yes → Analyze with Groq AI
            ↓
        Is it gibberish?
        ├─ Yes → REJECT (critical issue)
        ├─ No, readable → PASS ✅
        └─ Unclear → Flag for manual review
```

## Configuration

The OCR models require:
- `REPLICATE_API_TOKEN` environment variable
- Replicate account with credits

Models are called in order of reliability, with automatic fallbacks.

## What Gets Flagged

**Critical Issues** (Auto-Reject):
- Gibberish text detected
- Random characters instead of words
- Corrupted/scrambled text

**Warning Issues** (Manual Review):
- Unreadable text (but not clearly gibberish)
- Non-English text (may be intentional)

**Accepted**:
- Readable English text
- Stylized but readable text
- Foreign languages (if part of design)
- No text at all (visual-only images)

## Debugging

Check server logs for:
```
📸 Image text analysis (tesseract-ocr): Found text: "...", Readable: true/false, Language: english/gibberish
```

This shows:
- Which OCR method was used
- What text was extracted
- Whether it's readable
- Language classification

## Improving Detection

If gibberish is not being detected:

1. **Check OCR extraction**: Look at logs to see what text was extracted
2. **Review detection prompt**: The prompt in `analyzeExtractedText()` can be tuned
3. **Add more patterns**: Update gibberish detection rules in the validation logic
4. **Test with samples**: Generate test images with known gibberish to verify

## Common Issues

**Issue**: OCR fails to extract text
- **Solution**: System automatically tries multiple OCR methods
- **Fallback**: If all fail, flags for manual review

**Issue**: Readable text flagged as gibberish
- **Solution**: Check if text contains unusual characters or patterns
- **Adjust**: Update detection rules to be more lenient for styled text

**Issue**: Gibberish not detected
- **Solution**: Check extraction logs - may need better OCR model
- **Enhance**: Add more gibberish pattern detection rules

