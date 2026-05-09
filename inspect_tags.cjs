const { createClient } = require('@supabase/supabase-js');
const url = 'https://auaflmxizjwmpdetsgak.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWZsbXhpemp3bXBkZXRzZ2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTMyMjYsImV4cCI6MjA5MzE4OTIyNn0.Nk54WKAJaRPna8nO8TboDweURRdfeQGn_5IRlanJeIU';
const supabase = createClient(url, key);

(async () => {
    console.log('--- Current Tags in DB ---');
    const { data, error } = await supabase.from('tags').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    data.forEach(row => {
        console.log(`Name: ${row.data.name}, ID: ${row.id}, Category: ${row.data.category}, sortOrder: ${row.data.sortOrder}`);
    });
})();
