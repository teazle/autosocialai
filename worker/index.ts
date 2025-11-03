import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { checkDuePosts } from './jobs/check-due-posts';
import { generateContent } from './jobs/generate-content';
import { refreshTokens } from './jobs/refresh-tokens';

console.log('🚀 AutoSocial AI Worker Started');

// Run check-due-posts every 30 seconds
setInterval(async () => {
  try {
    await checkDuePosts();
  } catch (error) {
    console.error('Error in check-due-posts:', error);
  }
}, 30000);

// Run generate-content every 10 minutes
setInterval(async () => {
  try {
    await generateContent();
  } catch (error) {
    console.error('Error in generate-content:', error);
  }
}, 600000);

// Run refresh-tokens every 6 hours
setInterval(async () => {
  try {
    await refreshTokens();
  } catch (error) {
    console.error('Error in refresh-tokens:', error);
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

