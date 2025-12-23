// Cloudflare deployment config (optional - only needed for Cloudflare deployments)
// Install @opennextjs/cloudflare if deploying to Cloudflare
let config: any;

try {
  const { defineCloudflareConfig } = require("@opennextjs/cloudflare");
  config = defineCloudflareConfig({
    // Optional: Customize caching behavior
    // cache: {
    //   handler: ".open-next/cache",
    //   path: ".open-next/cache",
    // },
  });
} catch (e) {
  // Module not installed - not using Cloudflare deployment
  config = {};
}

export default config;



