import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { checkDuePosts } from './jobs/check-due-posts';
import { generateContent } from './jobs/generate-content';
import { refreshTokens } from './jobs/refresh-tokens';

console.log('🚀 AutoSocial AI Worker Started');

// State flags to prevent overlapping runs
let isChecking = false;
let isGenerating = false;
let isRefreshing = false;

// Run check-due-posts every 30 seconds
setInterval(async () => {
  if (isChecking) {
    console.log('Skipping check-due-posts: Previous run still active');
    return;
  }
  isChecking = true;
  try {
    await checkDuePosts();
  } catch (error) {
    console.error('Error in check-due-posts:', error);
  } finally {
    isChecking = false;
  }
}, 30000);

// Run generate-content every 10 minutes
setInterval(async () => {
  if (isGenerating) {
    console.log('Skipping generate-content: Previous run still active');
    return;
  }
  isGenerating = true;
  try {
    await generateContent();
  } catch (error) {
    console.error('Error in generate-content:', error);
  } finally {
    isGenerating = false;
  }
}, 600000);

// Run refresh-tokens every 6 hours
setInterval(async () => {
  if (isRefreshing) {
    console.log('Skipping refresh-tokens: Previous run still active');
    return;
  }
  isRefreshing = true;
  try {
    await refreshTokens();
  } catch (error) {
    console.error('Error in refresh-tokens:', error);
  } finally {
    isRefreshing = false;
  }
}, 21600000);

// Initial run
console.log('Running initial tasks...');
Promise.all([
  checkDuePosts(),
  generateContent(),
  refreshTokens(),
]).then(() => {
  console.log('✅ Initial tasks completed');
}).catch((error) => {
  console.error('Error in initial tasks:', error);
});

