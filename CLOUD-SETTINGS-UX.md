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
