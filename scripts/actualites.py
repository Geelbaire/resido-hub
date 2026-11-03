#!/usr/bin/env python3
"""Collecte l'actualité de Résido et écrit actualites.json.

Utilisation : python3 scripts/actualites.py _site/actualites.json
Dépendance : feedparser (pip install "feedparser>=6,<7")

Seuls les titres, la source, la date et le lien sont conservés : jamais le
texte des articles.
"""
import calendar
import html
import json
import re
import sys
import time
import urllib.request

import feedparser

AGENT = "Mozilla/5.0 (compatible; Resido/1.0; +https://resido.ca)"
DELAI = 20  # secondes par fil

SOURCES = {
    "region": [
        ("Courrier de Portneuf", "https://www.courrierdeportneuf.com/feed/"),
        ("Radio-Canada Québec", "https://ici.radio-canada.ca/info/rss/quebec/en-continu"),
    ],
    "techno": [
        ("Radio-Canada", "https://ici.radio-canada.ca/info/rss/techno/en-continu"),
        ("La Presse", "https://www.lapresse.ca/affaires/techno/rss"),
        ("Numerama", "https://www.numerama.com/tech/feed/"),
    ],
    "ia": [
        ("ActuIA", "https://www.actuia.com/feed/"),
    ],
    "pop": [
        ("Billboard", "https://www.billboard.com/c/music/pop/feed/"),
        ("Radio-Canada", "https://ici.radio-canada.ca/info/rss/sous-theme/musique"),
    ],
}

RUBRIQUES = [
    ("region", "Portneuf et Québec", "Région"),
    ("techno", "Technologie", "Techno"),
    ("ia", "Intelligence artificielle", "IA"),
    ("pop", "Musique pop", "Pop"),
]

# Titres technos qui parlent d'IA : ils vont dans la rubrique IA.
MOTIFS_IA = re.compile(
    r"\bIA\b|\bI\.A\.|\bAI\b|intelligence artificielle|artificial intelligence|"
    r"ChatGPT|OpenAI|Anthropic|\bGemini\b|\bCopilot\b|\bLLM\b|Mistral AI|"
    r"apprentissage automatique|machine learning"
)

# Titres purement promotionnels, écartés partout.
MOTIFS_PROMO = re.compile(
    r"Black Friday|Cyber Monday|Prime Day|French Days|Singles Day|"
    r"bons? plans?|meilleures offres|code promo|en promo\b",
    re.IGNORECASE,
)

AGE_MAX = {"region": 4, "techno": 4, "ia": 6, "pop": 7}  # jours
PAR_RUBRIQUE = 6
PAR_SOURCE = 3


def nettoyer(texte):
    texte = html.unescape(re.sub(r"<[^>]+>", " ", texte or ""))
    texte = re.sub(r"\s+", " ", texte).strip()
    return texte[:160]


def lire(source, url):
    requete = urllib.request.Request(url, headers={"User-Agent": AGENT})
    with urllib.request.urlopen(requete, timeout=DELAI) as reponse:
        donnees = reponse.read()
    flux = feedparser.parse(donnees)
    articles = []
    for entree in flux.entries:
        moment = entree.get("published_parsed") or entree.get("updated_parsed")
        titre = nettoyer(entree.get("title"))
        if not moment or not titre or MOTIFS_PROMO.search(titre):
            continue
        articles.append({
            "titre": titre,
            "source": source,
            "date": calendar.timegm(moment),
            "lien": entree.get("link", ""),
        })
    return articles


def choisir(articles, sources, maintenant, age_max):
    """Garde les articles récents, sans doublon, en alternant les sources
    dans l'ordre de SOURCES (la source la plus locale d'abord)."""
    vus = set()
    files = {nom: [] for nom, _ in sources}
    for a in sorted(articles, key=lambda a: a["date"], reverse=True):
        if maintenant - a["date"] > age_max * 86400 or a["date"] > maintenant + 3600:
            continue
        cle = re.sub(r"\W+", "", a["titre"].lower())[:60]
        if cle in vus:
            continue
        vus.add(cle)
        files.setdefault(a["source"], []).append(a)
    retenus = []
    for rang in range(PAR_SOURCE):
        for nom in files:
            if rang < len(files[nom]) and len(retenus) < PAR_RUBRIQUE:
                retenus.append(files[nom][rang])
    return retenus


def main():
    sortie = sys.argv[1] if len(sys.argv) > 1 else "actualites.json"
    maintenant = int(time.time())
    bruts = {cle: [] for cle in SOURCES}
    for cle, sources in SOURCES.items():
        for source, url in sources:
            try:
                articles = lire(source, url)
                bruts[cle].extend(articles)
                print(f"{cle:7s} {len(articles):3d}  {source}")
            except Exception as erreur:  # un fil en panne ne bloque pas les autres
                print(f"{cle:7s} ERREUR {source} : {erreur}")

    # Les titres technos qui parlent d'IA passent dans la rubrique IA.
    techno_ia = [a for a in bruts["techno"] if MOTIFS_IA.search(a["titre"])]
    bruts["ia"].extend(techno_ia)
    bruts["techno"] = [a for a in bruts["techno"] if not MOTIFS_IA.search(a["titre"])]

    rubriques = []
    for cle, titre, court in RUBRIQUES:
        articles = choisir(bruts[cle], SOURCES[cle], maintenant, AGE_MAX[cle])
        rubriques.append({"id": cle, "titre": titre, "court": court, "articles": articles})
        print(f"{cle:7s} retenus : {len(articles)}")

    with open(sortie, "w", encoding="utf-8") as fichier:
        json.dump({"genere": maintenant, "rubriques": rubriques}, fichier, ensure_ascii=False)


if __name__ == "__main__":
    main()
