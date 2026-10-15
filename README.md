# NAW — Native Agentic Workflow (prednáška)

60-minútová konferenčná prednáška v slovenčine: ~52 min rozprávania + 8 min Q&A, 48 slidov, 9 terminálových dem.
Autor: Tomas Blanarik · Visma / Norvato.

Storyboard a scenár (zdroj pravdy pre obsah): [NAW — Storyboard a scenár prezentácie](https://claude.ai/code/artifact/8b3b5df7-1115-404c-9e5a-91461dae253e).
NAW samotné žije v repozitári `naw-claude`; tento repozitár ho len popisuje.

## Spustenie

```bash
npm run serve          # http://127.0.0.1:8765/
```

Otvor v Chrome, prepni na celú obrazovku (`F` v prehliadači / `⌃⌘F`). Všetko je lokálne — fonty aj reveal.js
sú vo `vendor/`, prezentácia nepotrebuje internet. Funguje aj priamo cez `file://`, server je len istota.

## Ovládanie

| Kláves | Akcia |
| --- | --- |
| `→` / medzerník | ďalší krok (fragment alebo spustenie dema) |
| `←` | späť; demo na slide sa resetuje |
| `S` | pohľad prezentéra: poznámky, ďalší slide, časovač a tempo (52:10) |
| `F` | okamžite dokončiť bežiace demo, zastaví aj hudbu a zvukové efekty |
| `R` | prehrať terminály na aktuálnom slide znova |
| `O` / `Esc` | prehľad slidov |
| `#/s31` v URL | skok na konkrétny slide (`s01` … `s41`, plus `s02b`, `s29b`, `s33b`, `s33c`, `s35a`, `s35b`, `s35c`) |

Každý slide má `data-timing`, takže pohľad prezentéra ukazuje, či si v pláne.

## Štruktúra

```
index.html        slidy + slovenské poznámky (<aside class="notes">)
css/theme.css     vizuálny jazyk: farby, typografia, terminál, rail
css/slides.css    rozloženie a animácie jednotlivých slidov
js/deck.js        init reveal.js, rastúca koľajnica workflow, prehrávač terminálov
js/doom.js        S02b: 20 s animácia „here we go“ synchronizovaná s audio/doom-intro-20s-fade.mp3
audio/sfx-*.mp3   krátke zvuky na klik (S03, S23, S35a): atribút data-sfx na fragmente
demos/demos.js    nahrávky D1–D9 (príkazy, výstup, časovanie)
tools/check.mjs   headless kontrola všetkých slidov + export PDF
vendor/           reveal.js 5, notes plugin, fonty JetBrains Mono a Inter Tight
```

## Úprava dema

Dema sú dáta v `demos/demos.js` — pole krokov (`cmd`, `out`, `user`, `gap`, `pause`, `big`, `flash`).
Formát je popísaný v hlavičke súboru. Slide demo spustí buď pri vstupe (`data-play="enter"` na `.term`),
alebo na klik cez `<span class="fragment play" data-term="…" data-demo="…">`.

## Kontrola a PDF

```bash
npm run check          # screenshoty všetkých slidov do shots/, hlási JS chyby a pretečenia
npm run pdf            # to isté + NAW-presentation.pdf (záloha pre cudzí počítač)
```

`check` si spustí vlastný lokálny server a očakáva Google Chrome v `/Applications` (inak nastav `CHROME=…`). PDF sa tlačí po 10 stranách a spája,
lebo Chrome 48 Full HD strán naraz nevytlačí.
