# Quest teljesítés visszavonása

A napi COMPLETED listában a DONE helyett VISSZAVONÁS gomb található. A Quest újra aktív lesz; a játékos XP, a stat XP és a skill XP jutalma levonódik. A megszerzett szintek megfelelő küszöbértékeivel számol, így a szintlépést is visszafordítja. Nem állít vissza teljes korábbi snapshotot: más Quest jutalma, Training, history és a lezárt napokból számított streak megmarad.

A módosítás normál saveState mentés, tehát ugyanazon Cloud Core útvonalon szinkronizálódik. Ismételt visszavonás nem von le újra; újrateljesítés újból egyetlen jutalmat ad. Mentési hiba esetén a memóriabeli változás visszaáll. Másik fül újabb mentését nem írja felül. Napváltáskor a tegnapi képernyőről érkező visszavonás helyett a normál napi lezárás történik.

Csak a jelenlegi napi Questek teljesítése vonható vissza ezzel a gombbal. A történeti RECOVER DAY korrekció változatlan. Hibás vagy elégtelen jutalomadat esetén a művelet adatváltozás nélkül megáll.

Ellenőrzés: node tests/quest-undo.test.cjs és node tests/cloud-core.test.cjs; szintaxisellenőrzés az érintett JS-fájlokon. Szimuláció: játékos/stat szintküszöb, skill XP, másik Quest jutalma, dupla kattintás, újranyitás, újrateljesítés, kvótahiba, másik fül mentése, napváltás, normál szinkron útvonalon a false completed érték feltöltése. Valódi PC/telefon UI teszt még szükséges; nincs felhasználói PASS.

Felhasználói próba: egy aktuális napi Quest teljesítése, majd VISSZAVONÁS; XP/stat/skill visszaállása és aktív listába kerülés; másik eszközön is visszaáll; újrateljesítéskor csak egyszer kap jutalmat. A streak és Training maradjon meg. A frissített PWA cache neve akos-system-quest-undo-20261031-1.

A felhasználó kérésére a fejlesztés helyi develop, GitHub develop és GitHub main változatba is bekerül. A main így a korábbi develop automatikus Cloud Core folytatását is tartalmazza.
