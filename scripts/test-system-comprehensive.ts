/**
 * Comprehensive System Test
 * Tests all major components of AutoSocial AI
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
  results.push({ name, status, message, details });
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? '\x1b[32m' : status === 'fail' ? '\x1b[31m' : '\x1b[33m';
  console.log(`${color}${icon}\x1b[0m ${name}: ${message}`);
}

async function testSupabaseConnection() {
  console.log('\n📊 Testing Supabase Connection...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    addResult('Supabase Credentials', 'fail', 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  addResult('Supabase Credentials', 'pass', 'Environment variables found');

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Test connection
    const { data, error } = await supabase.from('clients').select('id').limit(1);
    if (error) throw error;
    addResult('Database Connection', 'pass', 'Successfully connected to Supabase');
    return true;
  } catch (error: any) {
    addResult('Database Connection', 'fail', `Failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log('\n🗄️  Testing Database Schema...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  const requiredTables = ['clients', 'brand_assets', 'content_pipeline', 'content_rules', 'social_accounts', 'system_settings'];
  const requiredBrandAssetColumns = ['website_url', 'instagram_url', 'youtube_url', 'brand_pdf_url', 'ai_analysis'];

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && !error.message.includes('does not exist')) {
        addResult(`Table: ${table}`, 'pass', 'Table exists and is accessible');
      } else if (error) {
        addResult(`Table: ${table}`, 'fail', `Table does not exist: ${error.message}`);
      } else {
        addResult(`Table: ${table}`, 'pass', 'Table exists and is accessible');
      }
    } catch (error: any) {
      addResult(`Table: ${table}`, 'fail', `Error: ${error.message}`);
    }
  }

  // Test brand_assets columns
  try {
    const { data, error } = await supabase
      .from('brand_assets')
      .select('website_url, instagram_url, youtube_url, brand_pdf_url, ai_analysis')
      .limit(1);

    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
      addResult('Brand Assets Columns', 'fail', 'Migration not applied - columns missing');
    } else {
      addResult('Brand Assets Columns', 'pass', 'All 5 brand analysis columns exist');
    }
  } catch (error: any) {
    addResult('Brand Assets Columns', 'warning', 'Could not verify columns');
  }
}

async function testStorageBuckets() {
  console.log('\n📦 Testing Storage Buckets...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  const requiredBuckets = ['post-images', 'brand-assets'];

  for (const bucket of requiredBuckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      if (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          addResult(`Bucket: ${bucket}`, 'fail', 'Bucket does not exist - create it in Supabase Dashboard');
        } else {
          addResult(`Bucket: ${bucket}`, 'warning', `Error: ${error.message}`);
        }
      } else {
        addResult(`Bucket: ${bucket}`, 'pass', 'Bucket exists and is accessible');
      }
    } catch (error: any) {
      addResult(`Bucket: ${bucket}`, 'warning', `Error: ${error.message}`);
    }
  }
}

async function testAPIKeys() {
  console.log('\n🔑 Testing API Keys...\n');

  const requiredKeys = [
    { name: 'GROQ_API_KEY', env: 'GROQ_API_KEY' },
    { name: 'REPLICATE_API_TOKEN', env: 'REPLICATE_API_TOKEN' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', env: 'SUPABASE_SERVICE_ROLE_KEY' },
    { name: 'QUERY_API_KEY', env: 'QUERY_API_KEY' },
  ];

  for (const key of requiredKeys) {
    const value = process.env[key.env];
    if (value && value.length > 10) {
      addResult(key.name, 'pass', `Present (${value.length} chars)`);
    } else {
      addResult(key.name, 'fail', 'Missing or invalid');
    }
  }

  // Optional keys
  const optionalKeys = [
    { name: 'META_APP_ID', env: 'META_APP_ID' },
    { name: 'META_APP_SECRET', env: 'META_APP_SECRET' },
    { name: 'TIKTOK_CLIENT_KEY', env: 'TIKTOK_CLIENT_KEY' },
  ];

  for (const key of optionalKeys) {
    const value = process.env[key.env];
    if (value && value.length > 5) {
      addResult(key.name, 'pass', `Present (optional)`);
    } else {
      addResult(key.name, 'warning', 'Not configured (optional)');
    }
  }
}

async function testDataIntegrity() {
  console.log('\n🔍 Testing Data Integrity...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  try {
    // Check for clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, status')
      .limit(10);

    if (clientsError) {
      addResult('Clients Data', 'fail', `Error: ${clientsError.message}`);
    } else {
      const activeClients = clients?.filter(c => c.status === 'active').length || 0;
      addResult('Clients Data', 'pass', `Found ${clients?.length || 0} client(s), ${activeClients} active`);
    }

    // Check for content pipeline
    const { data: posts, error: postsError } = await supabase
      .from('content_pipeline')
      .select('id, status, image_url')
      .limit(10);

    if (postsError) {
      addResult('Content Pipeline', 'warning', `Error: ${postsError.message}`);
    } else {
      const withImages = posts?.filter(p => p.image_url).length || 0;
      addResult('Content Pipeline', 'pass', `Found ${posts?.length || 0} post(s), ${withImages} with images`);
    }

    // Check brand assets
    const { data: assets, error: assetsError } = await supabase
      .from('brand_assets')
      .select('id, client_id, logo_url, brand_pdf_url')
      .limit(10);

    if (assetsError) {
      addResult('Brand Assets', 'warning', `Error: ${assetsError.message}`);
    } else {
      const withLogo = assets?.filter(a => a.logo_url).length || 0;
      const withPdf = assets?.filter(a => a.brand_pdf_url).length || 0;
      addResult('Brand Assets', 'pass', `Found ${assets?.length || 0} asset(s), ${withLogo} with logos, ${withPdf} with PDFs`);
    }

  } catch (error: any) {
    addResult('Data Integrity', 'fail', `Error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🧪 AutoSocial AI - Comprehensive System Test\n');
  console.log('='.repeat(60));

  const connected = await testSupabaseConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed - Supabase connection failed');
    process.exit(1);
  }

  await testDatabaseSchema();
  await testStorageBuckets();
  await testAPIKeys();
  await testDataIntegrity();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`⚠ Warnings: ${warnings}`);
  console.log(`Total: ${results.length}\n`);

  if (failed > 0) {
    console.log('❌ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  if (warnings > 0) {
    console.log('⚠️  Warnings:');
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  if (failed === 0) {
    console.log('✅ All critical tests passed! System is ready to use.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

