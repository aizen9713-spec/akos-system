# Cloud Core Settings UX — 2026-11-01

Helyi audit: tiszta develop munkapéldány, develop/main helyi fej 5c333cd. Fetch után origin/develop és origin/main: 9c1b1d5. A történetek eltérnek, de a fájltartalom azonos a sorvégek figyelmen kívül hagyásával. A helyi előzményeket megőriztük; main módosítás és push nem történt.

A részletes leírás, mentésösszesítés és diagnosztika alapból zárt natív details elemben található. Konfliktus esetén automatikusan kinyílik, az adatforrás-választás és megerősítés megmarad.

A shadow-cloud-v1:preferences külön tárolja a validált HTTPS Supabase projekt URL-t, kizárólag sb_publishable_ nyilvános kulcsot és e-mailt. Gépeléskor és belépéskor ment. Kijelentkezés és sikertelen session után is megmarad. Nem tartalmaz jelszót vagy tokent. A meglévő connection tároló, refresh token, account baseline, backup, CAS és Training védelem változatlan. A service worker cache új verziót kapott.

Automatikus ellenőrzés: cloud-core, cloud-two-device, quest-undo Node szimulációk és szintaxisellenőrzés sikeres. Külön teszt: preferenciák visszaállítása session nélküli újraindításkor, nyilvános kulcs szűrése, jelszómező üressége; meglévő refresh, offline, konfliktus, backup és Quest jutalom-visszavonás szimulációk sikeresek. Valódi Supabase/RLS és PC–telefon felhasználói PASS még nincs.

## Felhasználói teszt (develop build, eszközönként egy böngészőfül)
1. SYSTEM / Settings: a Részletek / Diagnosztika alapból csukott; nyitáskor megjelenik a diagnosztika. Belépés és státusz csukott állapotban is elérhető.
2. Külön tesztprojekttel add meg az URL-t, publishable kulcsot és e-mailt. Frissíts még belépés előtt: mindhárom megmarad, a jelszó üres.
3. Jelentkezz be. Az első eltérő mentésnél ellenőrizd az automatikusan kinyíló összesítést. Csak ellenőrzött tesztadatnál válassz forrást.
4. F5, majd alkalmazás bezárás/újranyitás ugyanazon a címen és böngészőben: érvényes session mellett automatikusan kapcsolódjon, ne kérjen jelszót. Hosszabb szünet után is próbáld ki a tokenfrissítést.
5. Kijelentkezés után frissíts: URL/kulcs/e-mail marad, jelszó üres, nincs automatikus belépés. Új belépéshez a tesztprojekt-megerősítés továbbra is szükséges.
6. PC-n teljesíts, majd vonj vissza egy teszt Questet. A telefonon kb. 5 másodpercen belül vagy visszatéréskor tűnjön el a pipa; XP/stat/skill értékek egyezzenek. Ismételd fordított irányban. Dupla visszavonás ne vonjon le újra, streak és Training maradjon helyes.
7. Offline módosíts eltérően mindkét eszközön, majd csatlakozz újra: konfliktusjelzés és választás jelenjen meg, ne legyen csendes felülírás. A diagnosztika nyíljon ki.

Main kiadás csak a felhasználó PASS jelzése után. Ebben a körben egyik ágra sem történt push.

## Folytatás — 2026-11-01
A felhasználó a Cloud Settings F5 / megjegyzett mezők UI tesztjére PASS-t adott. A Quest gomb Undo, az akció tooltipjei angolok; új service worker cache készül.
Audit: helyi develop 8e375cdf268888233c943723c096a1e89994da7e; origin/develop 48526818c2b9722f95fe83fdf7ef5596264b42b6; origin/main 9c1b1d5f0322a7e5e502c5b4917c020ceb195fd8; helyi main 5c333cdd97806aca06feb0d0bb5c64f0034b5bb4. A munkapéldány tiszta volt; develop 13 megőrzött helyi előzménycommittal előrébb, tartalma origin/develop-pal azonos a sorvégek figyelmen kívül hagyásával. Nincs reset, force push vagy adatfájl-módosítás.
Ellenőrzések: quest-undo, cloud-core, bővített cloud-two-device Node szimulációk PASS; JavaScript szintaxis és git diff --check PASS. Új lefedés: telefon Undo -> PC XP/stat/skill/streak/localStorage, offline complete -> reconnect revision +1, mindkét oldalon eltérő offline változtatás -> nincs írás, mindkét payload megmarad és választás szükséges.
Valódi Supabase/RLS, telefon-PC és offline felhasználói teszt még NINCS lefuttatva. A tesztek elkülönített memóriabeli mentéseket használnak; a valódi böngésző localStorage és felhőadat nem lett módosítva. Sync implementációs javítást a szimulációk nem indokoltak.
Következő felhasználói teszt a develop builden: Undo felirat ellenőrzése; PC complete -> telefon -> PC Undo -> telefon, majd fordítva; minden lépésnél revision, XP/stat/skill/streak és Training ellenőrzése. Offline complete egy eszközön, reconnect és automatikus átadás; külön tesztadatokkal eltérő offline módosítás két eszközön, reconnect után konfliktusjelzés és csendes felülírás hiánya. Konfliktusnál ne válassz forrást a mentések ellenőrzése nélkül.
Main ebben a folytatásban változatlan: az új Undo/sync/offline csomaghoz még felhasználói PASS szükséges.
