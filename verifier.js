// Vérifie que le JavaScript de index.html est du ES5 pur (compatible Safari 10).
// Utilisation : node verifier.js   (demande le module acorn : npm i acorn)
var fs = require('fs');
var acorn = require('acorn');
var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
var scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
var ok = true;
scripts.forEach(function (s, i) {
  var code = s.replace(/^<script>/, '').replace(/<\/script>$/, '');
  try { acorn.parse(code, { ecmaVersion: 5 }); console.log('Script ' + (i + 1) + ' : ES5 valide'); }
  catch (e) { ok = false; console.log('Script ' + (i + 1) + ' : ' + e.message); }
});
var interdits = ['backdrop-filter', 'clamp(', 'aspect-ratio', ':is(', ':where(', 'inset:', ' gap:', 'fetch(', 'Array.from', '.includes(', '.startsWith(', '.find(', 'Object.assign', '=>', '`'];
interdits.forEach(function (m) { if (html.indexOf(m) !== -1) { ok = false; console.log('Élément non pris en charge par Safari 10 : ' + m); } });
console.log(ok ? 'Compatible Safari 10 : OK' : 'Problèmes détectés');
process.exit(ok ? 0 : 1);
