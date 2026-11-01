# SHADOW OS Skill Icon System V1.0

A 12 meglévő skill közös megjelenítési ikonmappingje: js/config/skills.js.
Quest: ikonos lista és kiválasztott mező, a működő stat selector mintájával; az eredeti select a jutalomérték forrása. Player Skills: azonos ikonok. A stat selector változatlan.
Theme tokenek, 44 px célméret, görgethető és viewporthoz igazított lista; nyilak, Home/End, kezdőbetű, Enter/Space, Escape/Tab, külső kattintás. A mentés formátuma nem változik. Az offline cache tartalmazza az új fájlokat.

Ellenőrzés: node --test tests/*.test.cjs: 7/7 PASS. Célzott skill DOM-szimuláció + Quest/undo/import-export/Training/Cloud regressziók. git diff --check PASS. Valódi böngészős teszt nem futott: Edge indulása a futtatási környezetben meghiúsult. Telefonos és képernyőolvasós ellenőrzés még szükséges.

Felhasználói próba a develop builden:
1. Frissítsd az alkalmazást, majd Quest létrehozásnál nyisd meg a skillválasztót. Mind a 12 név és ikon látszódjon; a választott ikon a mezőben is maradjon meg.
2. Nyilak, Home/End, kezdőbetű, Enter/Space választás; Escape megszakítás; Tab továbblépés.
3. Külön tesztmentésben hozz létre skilljutalmas Questet; utána No skill jelenjen meg. Teljesítés/visszavonás csak a várt XP-t változtassa.
4. Player Skills: az ikonok egyezzenek a választóval. Ellenőrizd Shadow Blue, Imperial Gold, Crimson témában és telefonon a hosszú neveket, görgetést, érintést.
5. Meglévő export/import és Cloud Sync működését tesztadatokon ellenőrizd.

A helyi Quest/ exportált JSON érintetlen. Main kiadás csak felhasználói PASS után.
