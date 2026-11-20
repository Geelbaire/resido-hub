"""Mesure les changements d'image dans la zone du sujet, au-dessus des titres."""
import json
from pathlib import Path
from PIL import Image, ImageChops

episode = Path(__file__).resolve().parents[1]
directory = episode / 'controle'
scenes = json.loads((episode / 'alignment-report.json').read_text())['scenes']
results = []
for aspect in ('16x9', '9x16'):
    for scene in scenes:
        group = directory / aspect / scene['id']
        files = sorted(group.glob('vue-*.jpg'))
        if len(files) != 12:
            raise ValueError(f'{group} : {len(files)} vues sur 12')
        images = []
        for file in files:
            with Image.open(file) as source:
                w,h = source.size
                right,bottom = (.90,.69) if aspect == '9x16' else (.96,.76)
                images.append(source.convert('RGB').crop((int(w*.04),int(h*.09),int(w*right),
                    int(h*bottom))).resize((80,56)))
        fractions = []
        for first, second in zip(images,images[1:]):
            histogram = ImageChops.difference(first,second).convert('L').histogram()
            fractions.append(sum(histogram[24:]) / (80*56))
        changes = sum(fraction > .037 for fraction in fractions)
        record = dict(format=aspect,scene=scene['id'],views=12,changedAdjacentPairs=changes,
                      distinctViews=1+changes,delta=[round(f,4) for f in fractions])
        results.append(record)
        print(aspect,scene['id'],f'{1+changes}/12')
(directory / 'variation-planches.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
if min(record['distinctViews'] for record in results) < 9:
    raise ValueError('Une planche comporte moins de neuf vues distinctes selon la mesure')
