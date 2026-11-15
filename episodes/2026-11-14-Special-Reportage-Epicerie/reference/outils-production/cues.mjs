// node cues.mjs <n> : temps (s locaux) de chaque phrase de la scène n (1-based)
import fs from 'node:fs';
const sb = JSON.parse(fs.readFileSync('/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Special-Reportage-Epicerie/storyboard.json','utf8'));
const sc = sb.scenes[Number(process.argv[2]) - 1];
const n = sc.narration, wt = sc.wordTimes;
const at = (i) => { let k = wt.findIndex(x => x[0] >= i); return k < 0 ? sc.duration : wt[k][1]; };
console.log(sc.id, 'durée', sc.duration);
for (const m of n.matchAll(/[^.!?;:—]+[.!?;:—]?/g)) console.log(at(m.index).toFixed(2).padStart(6), m[0].trim().slice(0, 90));
