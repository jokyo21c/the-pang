const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://trrbnqsoonntafpeamkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycmJucXNvb25udGFmcGVhbWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODkxMDIsImV4cCI6MjA5MDc2NTEwMn0.4ePv08u88njYJojFivO8zbz9DH68iGbrPbtozQ5m1xc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('members').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Members:", data);
    }
}

check();
