# Háttérgaléria – ellenőrzés

A Background legördülő helyett tíz képes kártya jelenik meg. A natív rádiógombok biztosítják a billentyűzetes kezelést; a keret és a „✓ Selected” szöveg mutatja a választást. Az előnézetek a háttérmotor CSS-szabályait és meglévő képeit használják. A shadow-os-appearance-v1 mentési kulcs és az alapértékek megmaradtak.

## Kézi teszt a develop változaton
1. Indítsd a helyi projektet a szokásos VS Code Live Serverrel. Nyisd meg a CONFIG → Theme & Background panelt.
2. Kattints mind a tíz háttérkártyára. A háttér azonnal váltson, egyetlen kártyán legyen keret és ✓ Selected jelzés.
3. Válts mindhárom Theme között. A kiválasztott háttér maradjon meg; a Minimal HUD és Shadow Core a palettát kövesse.
4. Állítsd a Background visibility értékét 0%, 35%, majd 100%-ra. Csak az oldal háttérképe változzon, a szöveg és a kártyák maradjanak olvashatók. Az előnézetek 0%-nál is látszódjanak.
5. Válassz hátteret, témát és láthatóságot, majd frissíts. Mindhárom beállítás és a kijelölés maradjon meg.
6. Tab billentyűvel lépj a galériába; a fókusz látszódjon. Nyílbillentyűkkel válts a kártyák között, a kijelölés és háttér kövesse.
7. Nyisd meg ugyanazt a címet második lapon. Az ott kiválasztott háttér jelenjen meg az első lapon is.
8. Ellenőrizd 320, 375, 768 és 1440 px szélességen: nincs vízszintes kilógás, a kártyák érinthetők, a feliratok törnek.
9. RESET APPEARANCE: Shadow Blue téma, Cinematic Transmission háttér, 60% láthatóság legyen az eredmény.
10. Külön tesztprofilban, a develop változatot kiszolgáló környezetben várd meg a service worker települését, majd kapcsold offline módba és töltsd újra. A galéria működjön. Localhoston az alkalmazás szándékosan nem regisztrál service workert; az automatizált teszt ezt külön regisztrálta. Az éles telefonos alkalmazást ehhez nem kell használni.

## Elvégzett automatizált ellenőrzés
Izolált Chrome-profil, helyi statikus kiszolgáló: mind a 30 téma/háttér kombináció, újratöltés utáni megőrzés, előnézet és háttér CSS-egyezése, láthatóság, nyílbillentyűk, lapok közti szinkron, négy képernyőszélesség, alaphelyzet, offline működés, nem elérhető tároló visszajelzése. A többi localStorage rekord változatlan maradt; nem volt JavaScript-oldalhiba. Valódi telefonos próba nem történt.

## Állapotvédelem
Távoli develop induló pont: cb96533930b5fe0a87e6cafc8b9cfdf86981e41e.
Checkpoint: checkpoint/develop-before-background-gallery-20261030.
A helyi projekt három tartalmi eltérése (css/components/navigation.css, css/core/variables.css, js/ui/quests.js) megmaradt. Csak index.html, js/features/appearance.js, css/components/appearance.css és sw.js frissült helyben. A helyi Git HEAD és index a korábbi állapoton maradt: a meglévő nem commitolt munkát nem rendeztük át. A main és az éles telefonos adatok nem módosultak.
