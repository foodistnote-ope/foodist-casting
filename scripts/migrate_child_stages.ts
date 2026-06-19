import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Key is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateData() {
  console.log('Fetching all foodists...');
  const { data: rows, error: fetchError } = await supabase
    .from('foodists')
    .select('id, data');

  if (fetchError) {
    console.error('Error fetching foodists:', fetchError);
    return;
  }

  console.log(`Found ${rows.length} foodists.`);

  let updatedCount = 0;

  for (const row of rows) {
    const foodist = row.data;
    let modified = false;

    if (foodist.childStage && Array.isArray(foodist.childStage)) {
      const newChildStage = foodist.childStage.map((stage) => {
        if (stage === '乳幼児あり' || stage === '乳幼児') return '乳幼児';
        if (stage === '未就学児あり' || stage === '未就学児') return '未就学児';
        if (stage === '小学生の子あり' || stage === '小学生の子' || stage === '小学生') return '小学生';
        if (stage === '中高生の子あり' || stage === '中高生の子' || stage === '中学生' || stage === '中高生') return '中高生';
        if (stage === '成人した子あり' || stage === '成人した子' || stage === '成人') return '成人';
        return stage;
      });

      // Sort by correct predefined order
      const correctOrder = ['乳幼児', '未就学児', '小学生', '中高生', '成人', '回答しない', '未確認'];
      newChildStage.sort((a, b) => {
        let indexA = correctOrder.indexOf(a);
        let indexB = correctOrder.indexOf(b);
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        return indexA - indexB;
      });

      // Check if any change was made (content or order)
      if (foodist.childStage.length !== newChildStage.length) {
          modified = true;
      } else {
        for (let i = 0; i < foodist.childStage.length; i++) {
          if (foodist.childStage[i] !== newChildStage[i]) {
            modified = true;
            break;
          }
        }
      }

      if (modified) {
        foodist.childStage = newChildStage;
      }
    }

    if (modified) {
      console.log(`Updating foodist ${row.id}...`);
      const { error: updateError } = await supabase
        .from('foodists')
        .update({ data: foodist, updated_at: new Date().toISOString() })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Error updating foodist ${row.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} foodists.`);
}

migrateData();
