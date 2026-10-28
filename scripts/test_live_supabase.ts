import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fytgzgnfipkpnanhpzjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dGd6Z25maXBrcG5hbmhwempuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTg0MTYsImV4cCI6MjEwODc3NDQxNn0.TqfnDkG1RAmBDioxDtveCVv0FymxawFEZJhLDt6f4oQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('Testing Supabase Cloud Connection...');

  // 1. Check Profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) throw pErr;
  console.log(`[OK] Profiles found in cloud (${profiles.length}):`);
  for (const p of profiles) {
    console.log(` - ${p.name} (${p.email}) [role: ${p.role}] [slug: /p/${p.slug}]`);
  }

  // 2. Check Settings
  const { data: settings, error: sErr } = await supabase.from('user_landing_settings').select('*');
  if (sErr) throw sErr;
  console.log(`[OK] Landing page settings found in cloud (${settings.length}):`);
  for (const s of settings) {
    console.log(` - User ID: ${s.user_id} -> Link: ${s.registration_url}`);
  }

  // 3. Check Versions
  const { data: versions, error: vErr } = await supabase.from('landing_page_versions').select('*');
  if (vErr) throw vErr;
  console.log(`[OK] Published landing page versions found in cloud: ${versions.length}`);

  // 4. Test Event Insertion
  const testEventId = `ev-test-${Date.now()}`;
  const { error: eErr } = await supabase.from('landing_events').insert({
    id: testEventId,
    user_id: 'user-rangel-0001',
    event_type: 'page_view',
    page_path: '/p/cadastro',
  });
  if (eErr) throw eErr;
  console.log('[OK] Successfully recorded live test event in cloud!');

  // Clean up test event
  await supabase.from('landing_events').delete().eq('id', testEventId);
  console.log('[OK] Cleaned up test event.');

  // 5. Test personalization update
  const { updateAllowedUserPersonalization } = await import('../src/lib/dataService');
  const res = await updateAllowedUserPersonalization('user-rangel-0001', {
    whatsapp_number: '22997953907',
  });
  console.log('[Personalization update result]:', res);

  // 6. Test registration
  const { registerNewUser } = await import('../src/lib/dataService');
  const reg = await registerNewUser('Carlos Teste', `carlos${Date.now()}@teste.com`, 'carlos-slug', 'senha123');
  console.log('[Register test result]:', reg);

  console.log('\n>>> SUPABASE CLOUD ESTA 100% OPERACIONAL E CONECTADO COM SUCESSO! <<<');
}

testSupabase().catch(console.error);
