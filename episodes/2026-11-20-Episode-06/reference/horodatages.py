from collections import defaultdict
from decimal import Decimal, ROUND_CEILING
from pathlib import Path
import json
import re


episode = Path(__file__).resolve().parents[1]
report = json.loads((episode / 'alignment-report.json').read_text(), parse_float=Decimal)
story = json.loads((episode / 'storyboard.json').read_text())
scenes = report['scenes']
chapters = defaultdict(list)
for scene in scenes:
    chapters[scene['chapterId']].append(scene)

def stamp(value, millis=False):
    if millis:
        value=Decimal(value).quantize(Decimal('.001'))
    whole = int(value)
    minutes, seconds = divmod(whole, 60)
    result = f'{minutes:02d}:{seconds:02d}'
    if millis:
        result += '.' + f'{int((Decimal(value) - whole) * 1000):03d}'
    return result

def duration(value):
    minutes, seconds = divmod(int(value), 60)
    return f'{minutes} min {seconds:02d} s'

titles = dict(zip(chapters, [
    "Enquête · L'illusion locale", 'Vétérinaires, dentistes & faille MSO',
    'Funérailles, garages, thermopompes & Roll-ups',
    'Test de 30 s au REQ & vos droits au Québec',
    "Loi d'affichage & Question du Jour",
]))
names = {
    'ch1':'Short-1-Veterinaires-Dentistes-Fonds-9x16.mp4',
    'ch2':'Short-2-Funerailles-Garages-Trois-Soumissions-9x16.mp4',
    'ch3':'Short-3-Test-30-Secondes-REQ-Droits-Quebec-9x16.mp4',
}
rows = ['| Chapitre | Début | Fin | Durée | Usage Shorts / Reels |',
        '|---|---:|---:|---:|---|']
metadata = [';FFMETADATA1','title=Le rachat furtif de nos quartiers','artist=FRANC NORD']
cuts = []
for i, (chapter, entries) in enumerate(chapters.items()):
    title = titles[chapter]
    start, end = entries[0]['start'], entries[-1]['end']
    if chapter in names:
        if end - start >= 180:
            raise ValueError(f'{chapter} atteint la limite de 180 s')
        use = f'`{names[chapter]}`'
        cuts.append({'chapter':chapter,'file':names[chapter],
            'start':float(start),'end':float(end),'duration':float(end-start)})
    else:
        use = 'Ouverture du reportage' if i == 0 else 'Débat citoyen final'
    rows.append(f'| `{i:02d}` · {title} | {stamp(start, True)} | {stamp(end, True)} | {stamp(end-start, True)} | {use} |')
    metadata.extend(['','[CHAPTER]','TIMEBASE=1/1000',
        f'START={int(start*1000)}',f'END={int(end*1000)}',f'title={title}'])

audio = report['audioDurationSeconds']
total = report['totalDurationSeconds']
frame_end = Decimal((total*30).to_integral_value(rounding=ROUND_CEILING))/30
kit = episode / 'KIT-PUBLICATION-REPORTAGE.md'
text = kit.read_text()
text = text.replace('SPÉCIAL REPORTAGE 10 MIN (ÉPISODE #6)', 'SPÉCIAL REPORTAGE (ÉPISODE #6)')
text = text.replace('de 10 minutes', 'de 10 min 37 s')
start = text.index('**Durée ')
end = text.index('\n---',start)
detail = [
    '**Repères précis par scène**', '',
    '| Scène | Début dans le reportage | Début dans le Short |',
    '|---|---:|---:|',
]
for item, scene in zip(scenes, story['scenes']):
    chapter = item['chapterId']
    local = stamp(item['start'] - chapters[chapter][0]['start'], True) if chapter in names else '—'
    detail.append(f"| {scene['shortVisualTitle']} | {stamp(item['start'], True)} | {local} |")
summary = (
    f'**Durée du montage {stamp(total, True)}** · 15 scènes · '
    f'voix {stamp(audio, True)} · 30 i/s. Le dernier photogramme porte la durée du fichier à {stamp(frame_end, True)}.'
)
text = text[:start] + summary + '\n\n' + '\n'.join(rows) + '\n\n' + '\n'.join(detail) + '\n' + text[end:]
starts = [group[0]['start'] for group in chapters.values()]
matched = list(re.finditer(r'^\d\d:\d\d(?= )',text,flags=re.M))
sequence = starts*2 + [entry['start']-group[0]['start'] for ch,group in chapters.items()
                       if ch in names for entry in group]
if len(matched) != len(sequence):
    raise ValueError(f'{len(matched)} horodatages publics pour {len(sequence)} repères')
for match, time in reversed(list(zip(matched,sequence))):
    text = text[:match.start()] + stamp(time) + text[match.end():]
for ch,group in chapters.items():
    if ch in names:
        text=re.sub(rf'(`{ch}` · )[^)]+\)',lambda m:m[1]+duration(group[-1]['end']-group[0]['start'])+')',text)
kit.write_text(text)
(episode / 'chapitres.ffmeta').write_text('\n'.join(metadata)+'\n')
(episode / 'chapitres-coupes.json').write_text(json.dumps(cuts,ensure_ascii=False,indent=2)+'\n')
