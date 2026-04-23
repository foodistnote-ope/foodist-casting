import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getAllFoodists, replaceAllFoodists } from './data/db';
import reelsData from './data/reelsData.json';

// --- Temporary One-Time DB Update Script (v2) ---
if (!sessionStorage.getItem('reelsUpdated_v2')) {
    getAllFoodists().then(async foodists => {
        let updatedCount = 0;

        // Normalize keys in reelsData (remove all spaces)
        const normalizedReelsData: Record<string, string> = {};
        for (const key of Object.keys(reelsData)) {
            const normalizedKey = key.replace(/[\s\u3000]+/g, '');
            normalizedReelsData[normalizedKey] = (reelsData as any)[key];
        }

        const mapped = foodists.map(f => {
            const normalizedName = f.displayName.replace(/[\s\u3000]+/g, '');
            const freq = normalizedReelsData[normalizedName];
            
            if (freq !== undefined && freq !== "") {
                const igAccountIndex = f.mediaAccounts.findIndex(a => a.mediaType === 'Instagram');
                let needsUpdate = false;

                if (igAccountIndex !== -1) {
                    if (f.mediaAccounts[igAccountIndex].reelsFrequency !== freq) {
                        f.mediaAccounts[igAccountIndex] = {
                            ...f.mediaAccounts[igAccountIndex],
                            reelsFrequency: freq,
                            updatedAt: new Date().toISOString()
                        };
                        needsUpdate = true;
                    }
                } else {
                    f.mediaAccounts.push({
                        id: `media_${f.id}_ig_auto`,
                        mediaType: 'Instagram',
                        metricType: 'フォロワー数',
                        reelsFrequency: freq,
                        showOnDetail: true,
                        sortOrder: 2,
                        updatedAt: new Date().toISOString()
                    });
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    updatedCount++;
                    return { ...f, updatedAt: new Date().toISOString() };
                }
            }
            return f;
        });

        if (updatedCount > 0) {
            await replaceAllFoodists(mapped);
            console.log(`Successfully updated reels frequency for ${updatedCount} foodists!`);
        } else {
            console.log("No new updates found.");
        }
        sessionStorage.setItem('reelsUpdated_v2', 'true');
    }).catch(err => console.error("Reels Update Script Error: ", err));
}
// ------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
