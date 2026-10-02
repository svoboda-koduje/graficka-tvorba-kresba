# Základy kresby – Grafická tvorba, 1. ročník

Interaktivní výukový web pro předmět **Grafická tvorba** v 1. ročníku oboru 18-20-M/01 Informační technologie – Počítačová grafika na SPŠE a VOŠ Pardubice (školní rok 2026/27).

Web je statický (HTML + CSS + JavaScript bez knihoven a bez sestavování), takže funguje přímo na **GitHub Pages**.

## Obsah

Každá etapa tematického plánu má vlastní záložku:

| Záložka | Etapa | Interaktivní prvek | Animace konstrukce |
|---|---|---|---|
| Úvod | plán, pomůcky, hodnocení | tvrdost tužky a přítlak | – |
| 01 Perspektiva | tělesa v 1- a 2úběžníkové perspektivě | perspektivní laboratoř (horizont, úběžníky, půdorys) | krychle ve 2úběžníkové perspektivě |
| 02 Rotační tělesa | rotační tělesa | elipsy podle výšky očí | váza |
| 03 Stínování | stínované těleso | světelná laboratoř (koule, válec, krychle), tónová škála | stínování koule |
| 04 Draperie | draperie | simulace látky mezi body napětí | draperie ve dvou bodech |
| 05 Zátiší | zátiší, proporce, kompozice | kompoziční hledáček, rozbor kresby, měření tužkou | zlatý řez |
| 06 Ruce | kompozice s rukama | schéma ruky (sevření, roztažení) | ruka |
| 07 Portrét | schémata, detaily, portrét dle vzoru a živého modelu | konstrukční hlava ve 3D | hlava zepředu |
| 08 Lebka | lebka zepředu a z profilu | interaktivní atlas kostí | lebka zepředu |
| 09 Figura | schematická figura, muž a žena, pohybové skici | kánon postavy, kreslicí panák, trénink skic | figura v kánonu 8 hlav |
| Volná témata | zvířata, krajina, přírodní uhel, soutěže | filtr ukázek | – |
| Videa | 39 ověřených videotutoriálů | filtr podle etap | – |

Záložky se přepínají přes adresu (`#perspektiva`, `#portret` …), takže lze sdílet odkaz přímo na konkrétní etapu i na její část (např. `#zatisi-zlaty-rez`).

## Struktura souborů

```
index.html                 – celý obsah webu (všechny záložky)
assets/css/styl.css        – vzhled
assets/js/data.js          – galerie obrázků, videa a kvízy (snadno upravitelné)
assets/js/app.js           – záložky, galerie, lightbox, videa, kvízy, animace, šipka nahoru
assets/js/interaktivni.js  – interaktivní ukázky jednotlivých etap
img/<etapa>/*.webp         – obrázky v plné velikosti (max. 1600 px)
img/<etapa>/nahled/*.webp  – náhledy do galerií (max. 640 px)
img/logo-spse*.png         – logo školy
.nojekyll                  – vypne zpracování Jekyllem na GitHub Pages
```

Všechny názvy souborů a složek jsou malými písmeny bez diakritiky a mezer – GitHub Pages rozlišuje velikost písmen a s diakritikou v adresách bývají potíže.

## Zveřejnění na GitHub Pages

1. Na GitHubu vytvořte nový veřejný repozitář, např. `zaklady-kresby`.
2. Nahrajte **obsah této složky** (ne složku samotnou) do kořene repozitáře. Webové rozhraní GitHubu nahraje najednou nejvýše 100 souborů – proto je nejpohodlnější **GitHub Desktop** (přetáhnout složku, Commit, Push), případně nahrávat po složkách `img/…`.
3. V repozitáři otevřete **Settings → Pages**, jako zdroj zvolte **Deploy from a branch**, větev `main`, složku `/ (root)` a uložte.
4. Za minutu až dvě bude web na adrese `https://svoboda-koduje.github.io/zaklady-kresby/`.

## Úpravy

- **Přidat obrázek:** uložte ho jako WebP do `img/<etapa>/` a menší náhled do `img/<etapa>/nahled/`, pak doplňte záznam do `window.GALERIE` v `assets/js/data.js` (cesta, náhled, rozměry, popisek).
- **Přidat video:** doplňte záznam do `window.VIDEA` v `assets/js/data.js` – stačí ID videa z YouTube, název, kanál a český popis.
- **Upravit kvíz:** `window.KVIZY` v `assets/js/data.js` (`a` je index správné odpovědi od nuly).

## Obrázky a autorská práva

Obrázky pocházejí z výukových podkladů vyučujícího. Studie Albrechta Dürera, Leonarda da Vinci a Michelangela jsou volným dílem. U ostatních ukázek (zejména referenčních kreseb a fotografií z internetu) je před veřejným zveřejněním vhodné ověřit autorství a případně doplnit jméno autora do popisku, nebo obrázek nahradit vlastní či žákovskou kresbou. Naskenované stránky učebnic a knih (Loomis, Creating Stylized Characters, české učebnice perspektivy a portrétu) do webu záměrně zařazeny nejsou.

Videa jsou vložena přes `youtube-nocookie.com` a načítají se až po kliknutí.
