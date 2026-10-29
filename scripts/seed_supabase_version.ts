import { createClient } from '@supabase/supabase-js';
import { initialLandingPageContent } from '../src/data/defaultLandingPage';

const supabaseUrl = 'https://fytgzgnfipkpnanhpzjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dGd6Z25maXBrcG5hbmhwempuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTg0MTYsImV4cCI6MjEwODc3NDQxNn0.TqfnDkG1RAmBDioxDtveCVv0FymxawFEZJhLDt6f4oQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: existing } = await supabase
    .from('landing_page_versions')
    .select('id')
    .eq('version_number', 1);

  if (!existing || existing.length === 0) {
    const { data, error } = await supabase.from('landing_page_versions').insert({
      id: 'ver-uuid-0001',
      version_number: 1,
      status: 'published',
      published_at: new Date().toISOString(),
      content_json: initialLandingPageContent,
    });
    if (error) console.error('Error inserting version 1:', error);
    else console.log('Version 1 inserted successfully into Supabase!');
  } else {
    const { error } = await supabase
      .from('landing_page_versions')
      .update({
        content_json: initialLandingPageContent,
        published_at: new Date().toISOString(),
      })
      .eq('version_number', 1);
    if (error) console.error('Error updating version 1:', error);
    else console.log('Version 1 content_json updated successfully in Supabase with officialChannels!');
  }
}

main().catch(console.error);
