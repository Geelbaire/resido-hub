import {readFile, writeFile} from 'node:fs/promises';

const control = new URL('../controle/',import.meta.url);
const result = {};
for (const format of ['16x9','9x16']) {
  const vertical = format === '9x16';
  const width = vertical ? 1080 : 1920;
  const height = vertical ? 1920 : 1080;
  const data = JSON.parse(await readFile(new URL('texte-'+format+'.json',control),'utf8'));
  const findings = {images:0, labels:0, zones:[], chevauchements:[]};
  for (const scene of data) {
    for (const {t,labels} of scene.samples) {
      findings.images++;
      findings.labels+=labels.length;
      for (const [i,a] of labels.entries()) {
        const outside = a.x0<0 || a.y0<0 || a.x1>width*(vertical?.9:1) ||
          a.y1>height*(vertical?.87:1);
        const brand = a.x0<600 && a.y0<130;
        const sources = a.x0<width/2 && a.y1>height-64;
        const watermark = a.x1>width-(vertical?240:300) && a.y1>height-(vertical?300:220);
        if (outside || brand || sources || watermark) {
          findings.zones.push({id:scene.scene,t,text:a.text});
        }
        for (const b of labels.slice(i+1)) {
          const dx = Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0);
          const dy = Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);
          if (a.g!==b.g && a.text!==b.text && dx>10 && dy>7) {
            findings.chevauchements.push({id:scene.scene,t,text:[a.text,b.text]});
          }
        }
      }
    }
  }
  result[format]=findings;
  console.log(format,findings.images+' images',findings.labels+' textes',
    findings.zones.length+' zones',findings.chevauchements.length+' chevauchements');
}
await writeFile(new URL('validation-texte.json',control),JSON.stringify(result,null,2)+'\n');
if (Object.values(result).some(item=>item.zones.length || item.chevauchements.length)) {
  throw new Error('Chevauchement typographique ou zone réservée.');
}
