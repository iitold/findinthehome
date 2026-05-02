const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bvrammmpcszrqasnxims.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cmFtbW1wY3N6cnFhc254aW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY5MTEyNCwiZXhwIjoyMDkzMjY3MTI0fQ.VbeTCnDyqKEDIdjWHDnMxhFBTuoNB_9bKLyj1_EOq0o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data, error } = await supabase.from('entities').select('*');
  if (error) console.error(error);
  console.log(`Found ${data.length} entities`);
  data.forEach(e => console.log(`- ${e.name} (${e.type}) [z: ${e.z}]`));
}

checkDb();
