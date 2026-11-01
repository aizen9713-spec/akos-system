# Cloud Core 1.3 – távoli változás betöltése

Bizonyított kódhiba: bármely fókuszban levő input/textarea/select megakadályozta a távoli mentés betöltését, akkor is, ha a felhasználó nem szerkesztette. A javítás csak az aktuálisan tényleges input eseménnyel szerkesztett mezőt védi; a Cloud Core saját bejelentkező mezőit kizárja. A mező elhagyásakor az összehasonlítás automatikusan újraindul.

Két független eszközkörnyezetet és közös revision-védett szervert utánzó teszt: PC Quest-visszavonás -> felhő -> telefon tartós mentés és memória; XP/stat/skill korrekció. Érintetlen fókusz nem blokkol, aktív szerkesztés blokkol, elhagyás után a függő változás betöltődik, auth mező nem blokkol. A korábbi Cloud Core és Quest-visszavonási tesztek is lefutottak.

Ez nem bizonyítja, hogy a felhasználó aktuális telefonos esetét ugyanez okozta. A két készülék Cloud Core állapotüzenete, revision és hiba értéke még szükséges. Nincs élő felhő- vagy készülékadat felülírás, nincs automatikus konfliktusfeloldás. Felhasználói PASS még nincs erre a javításra.

Próba az új BUILD 1.3-mal: mindkét eszköz legyen nyitva és bejelentkezve, PC-n Quest visszavonás, 5–10 másodperc után a telefonon is aktív legyen. Ellenőrizd mindkét revisiont és a jutalmakat. Ha nem változik, a paneladatokat kell összevetni; kézi teljes forrásválasztás nem szükséges a diagnózishoz. PWA cache: akos-system-sync-focus-20261031-1.
