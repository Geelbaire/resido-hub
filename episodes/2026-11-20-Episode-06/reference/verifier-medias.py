#!/usr/bin/env python3
"""Vérifie les deux masters, les trois coupes de chapitre et les deux pilotes."""
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

import numpy as np

episode = Path(__file__).resolve().parents[1]
ffmpeg = os.getenv('FFMPEG', '/opt/homebrew/bin/ffmpeg')
ffprobe = os.getenv('FFPROBE', '/opt/homebrew/bin/ffprobe')
cuts = json.loads((episode / 'chapitres-coupes.json').read_text())
story = json.loads((episode / 'storyboard.json').read_text())
alignment = json.loads((episode / 'alignment-report.json').read_text())
sample_rate = 8000
fps = 30


def run(command):
    return subprocess.run(command, check=True, capture_output=True)


def pcm(path):
    raw = run([ffmpeg, '-v', 'error', '-i', str(path), '-map', '0:a:0',
               '-ac', '1', '-ar', str(sample_rate), '-f', 'f32le', '-']).stdout
    return np.frombuffer(raw, dtype='<f4')


def crosscheck(original, decoded, begin, span):
    """Recherche le décalage et la corrélation sur huit fenêtres parlées."""
    observations = []
    wiggle = int(sample_rate * .15)
    extent = int(sample_rate * 1.2)
    for fraction in (.025, .09, .19, .32, .50, .65, .81, .96):
        at = max(wiggle, int(span * fraction * sample_rate))
        reference_at = int(begin * sample_rate) + at
        left = reference_at - wiggle
        right = reference_at + extent + wiggle
        x = decoded[at:at + extent].astype(np.float64)
        segment = original[left:right].astype(np.float64)
        if len(x) != extent or len(segment) != extent + 2 * wiggle:
            continue
        x -= x.mean()
        x_norm = np.linalg.norm(x)
        if x_norm < .25:
            continue
        n = 1 << (len(segment) + extent - 1).bit_length()
        correlation = np.fft.irfft(np.fft.rfft(segment, n) * np.fft.rfft(x[::-1], n), n)
        numerator = correlation[extent - 1:len(segment)]
        sums = np.r_[0, np.cumsum(segment)]
        squares = np.r_[0, np.cumsum(segment**2)]
        means = sums[extent:] - sums[:-extent]
        energy = squares[extent:] - squares[:-extent] - means**2 / extent
        scores = numerator / np.maximum(x_norm * np.sqrt(np.maximum(energy, 0)), 1e-9)
        best = int(scores.argmax())
        observations.append({
            'timeSeconds': round(at / sample_rate, 3),
            'lagMs': round((best - wiggle) / sample_rate * 1000, 2),
            'correlation': round(float(scores[best]), 5),
        })
    if len(observations) < 5:
        raise ValueError('Moins de cinq fenêtres parlées comparables')
    if min(v['correlation'] for v in observations) < .95:
        raise ValueError(f'Corrélation voix inférieure à .95 : {observations}')
    if max(abs(v['lagMs']) for v in observations) > 40:
        raise ValueError(f'Décalage voix supérieur à 40 ms : {observations}')
    return observations


def continuity(path, shape):
    width, height = shape
    sw, sh = (256, 144) if width > height else (144, 256)
    command = [ffmpeg, '-v', 'info', '-nostdin', '-xerror', '-threads', '3', '-i', str(path),
               '-map', '0:v:0', '-an', '-vf',
               f'scale={sw}:{sh},format=gray,freezedetect=n=-46dB:d=2.5,blackdetect=d=0.5:pix_th=0.052:pic_th=0.98,fps=4',
               '-threads:v', '1', '-f', 'rawvideo', '-']
    result = run(command)
    log = result.stderr.decode('utf8', errors='replace')
    frozen = re.findall(r'freeze_start: ([\d.]+)', log)
    black = re.findall(r'black_start:([\d.]+).*?black_duration:([\d.]+)', log)
    frames = np.frombuffer(result.stdout, dtype=np.uint8).reshape(-1, sh, sw)
    step = 8
    delta = np.abs(frames[step:].astype(np.int16) - frames[:-step].astype(np.int16))
    regions = (delta > 10).mean(axis=(1, 2))
    low = np.flatnonzero(regions < .012)
    ranges = []
    if len(low):
        for indices in np.split(low, np.flatnonzero(np.diff(low) > 1) + 1):
            if len(indices) >= 4:
                ranges.append({'from': round(indices[0] / 4, 3),
                               'to': round(indices[-1] / 4 + 2, 3),
                               'maxPictorialDelta': round(float(regions[indices].max()), 4)})
    return {'freezeOver2_5': frozen, 'matchedBlack': black, 'sampledFrames': len(frames),
            'lowVisualDelta': ranges}


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def check(entry, original):
    filename = entry['file']
    path = episode / filename
    details = json.loads(run([ffprobe, '-v', 'error', '-show_streams', '-show_format',
                              '-show_chapters', '-of', 'json', str(path)]).stdout)
    tracks = [track for track in details['streams'] if track['codec_type'] in ['audio', 'video']]
    if len(tracks) != 2:
        raise ValueError('Il faut une piste vidéo et une piste audio')
    video, audio = tracks
    shape = (1920, 1080) if entry['format'] == '16x9' else (1080, 1920)
    if (video['width'], video['height']) != shape or video['avg_frame_rate'] != '30/1':
        raise ValueError(f'Format vidéo inattendu : {filename}')
    if video['codec_name'] != 'h264' or audio['codec_name'] != 'aac' or audio['channels'] != 1:
        raise ValueError(f'Codecs inattendus : {filename}')
    duration = float(details['format']['duration'])
    if abs(duration - entry['duration']) > 2 / fps or (entry['kind']=='short' and duration>=180):
        raise ValueError(f'Durée inattendue : {filename} {duration}')
    cuts = details.get('chapters', [])
    if entry['kind'] == 'complete':
        expected = [scene for i, scene in enumerate(alignment['scenes'])
                    if i == 0 or scene['chapterId'] != alignment['scenes'][i-1]['chapterId']]
        if len(cuts) != len(expected):
            raise ValueError('Cinq chapitres attendus')
        for actual, chapter in zip(cuts, expected):
            if abs(float(actual['start_time']) - chapter['start']) > .002:
                raise ValueError(f'Chapitre non aligné : {chapter}')
    audio_data = pcm(path)
    voice_check = crosscheck(original, audio_data, entry.get('start', 0), entry['duration'])
    motion = continuity(path, shape)
    # Les plans stabilisés peuvent volontairement rester presque identiques.
    if motion['matchedBlack']:
        raise ValueError(f'Continuité numérique en échec : {motion}')
    return {'file': filename, 'durationSeconds': duration, 'bytes': path.stat().st_size, 'sha256': sha256(path),
            'format': entry['format'], 'frames': int(video['nb_frames']),
            'codecVideo': video['codec_name'], 'codecAudio': audio['codec_name'],
            'audioChannels': audio['channels'], 'chapterCount': len(cuts),
            'voiceMatch': voice_check, 'continuity': motion}


def main():
    digest = sha256(episode / 'voix.mp3')
    assert digest == story['productionStatus']['voiceSha256']
    data = pcm(episode / 'voix.mp3')
    master = alignment['totalDurationSeconds']
    entries = [
        {'file': f'Franc-Nord-Episode-06-{aspect}.mp4', 'format':aspect, 'kind':'complete',
         'start':0, 'duration':master}
        for aspect in ('16x9','9x16')
    ]
    entries.extend({'file':cut['file'], 'format':'9x16', 'kind':'short',
                    'start':cut['start'], 'duration':cut['duration']} for cut in cuts)
    entries.extend({'file':f'controle/Pilote-Ouverture-{aspect}.mp4', 'format':aspect, 'kind':'pilot',
                    'start':0, 'duration':alignment['scenes'][0]['end']} for aspect in ('16x9','9x16'))
    verified = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        pending = {pool.submit(check, item, data): item for item in entries}
        for task in concurrent.futures.as_completed(pending):
            label = pending[task]['file']
            verified.append(task.result())
            print('Vérifié', label, flush=True)
    by_file = {item['file']: item for item in verified}
    json_path = episode / 'VERIFICATION-MP4.json'
    json_path.write_text(json.dumps({'sourceVoiceSHA256': digest,
                                    'media': [by_file[item['file']] for item in entries],
                                    'boards': json.loads((episode / 'controle/variation-planches.json').read_text())},
                                   ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
