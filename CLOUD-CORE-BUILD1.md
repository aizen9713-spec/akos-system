# Cloud Core első build — 2026-10-30

Állapot: implementált fejlesztői build, NINCS felhasználói PASS. Valódi Supabase kapcsolat, SQL/RLS és PC–telefon teszt még nem történt; a konfigurációt a Work chatben kértem.

## Audit
- Helyi projekt: Documents/Ákos System app, develop, HEAD 5bafb57. Tárolt origin/develop fdbc0fd, helyi ág öt committal előrébb. GitHub develop ellenőrzött feje fdbc0fd. Main b5c7b76; develop mainhez képest 8 committal előrébb, 4-gyel hátrébb. Nem történt merge vagy main írás.
- Már módosított fájlok: css/components/training.css, index.html, js/features/training-data.js, js/features/training.js, sw.js. A módosításokról előzetes patch és a két érintett integrációs fájlról másolat készült. A Training fájlokat nem módosította a Cloud Core.
- localStorage akos-system-v0.1.0: teljes state, player/profil, XP, stats, skills, quests, history, historyCorrections, achievements, baseline, settings, log, activeDay, dailyMessageIndex, lastSavedAt és opcionális training (templates, draft, history). Teljes snapshotként szinkronizált; az ismeretlen mezők is megmaradnak.
- localStorage shadow-os-appearance-v1: theme, background, visibility. Továbbra is eszközönkénti beállítás; nincs a rendszerexportban és a Cloud Core-ban.
- Más localStorage/sessionStorage kulcsot a projekt JS forrása nem használ. A böngésző tényleges tárolóját és a telefon mentését nem olvastam vagy módosítottam.
- A normál saveState és a Training.update külön írja ugyanazt a state kulcsot. A Cloud Core 5 másodpercenként összehasonlítja a teljes tárolt értéket. Az eredeti helyi mentési útvonalak változatlanok.
- Teljes export: AKOS SYSTEM, saveVersion 1, state; import megerősítés után helyettesít, streaket újraszámolja, régi Training nélküli mentésnél a jelenlegi Training megmarad. Training export külön SHADOW OS TRAINING/version 1; import ID alapú merge, eltérő történeti ID elutasítása, tervváltozatok és draft védelme.

## Megvalósítás
SYSTEM oldalon Cloud Core panel. Csak explicit bejelentkezés után indul hálózat. Supabase email/jelszó bejelentkezés meglévő, megerősített tesztfiókkal; kizárólag HTTPS supabase.co URL és sb_publishable_ kulcs. A jelszó a kérés után ürül; access/refresh token csak memóriában, automatikus tokenfrissítéssel. Oldal újranyitásakor új bejelentkezés és adatforrás-választás szükséges. A leállítás a helyi kapcsolatot bontja; nem vonja vissza a szerveroldali tokent.

Első kapcsolódásnál helyi/felhő összehasonlító összesítés és kifejezett adatforrás-választás szükséges, még azonos adatnál is. Választáskor újraolvassa mindkét oldalt; megváltozott előnézettel nem ír. A szerver revíziószáma atomikus compare-and-swap feltétellel nő. Két eltérő módosítás esetén nincs last-write-wins: megáll és választást kér. Teljes snapshotokkal dolgozik, nincs mezőszintű automatikus merge. Training nélküli régi felhőmentés betöltése megőrzi a helyi Traininget.

Minden adatcsere előtt append-only localStorage shadow-cloud-v1:backup:<UUID> kulcsban eltárolja a régi helyi és felhőpéldányt. Ha a mentés/kvóta hibázik, az adatcsere megáll. A másolatok személyes adatokat tartalmaznak, automatikusan nem törlődnek. Helyreállítás: leállított Cloud Core mellett a másolat local mezője az eredeti akos-system-v0.1.0 érték; ne töröld az eredeti példányt a helyreállítás ellenőrzéséig.

Offline a jelenlegi helyi mentés működik tovább; a tartós helyi állapot a várakozó változás. Nyitott bejelentkezett oldalon visszatéréskor újraösszehasonlít. Aktív input szerkesztésekor a távoli betöltés megáll. Több böngészőfül használata a régi általános saveState útvonal miatt még nem teljesen védett; teszthez eszközönként egy fül használható. A cloud HTTP kéréseit a service worker nem kezeli és nem cache-eli.

## Supabase előkészítés
1. Külön tesztprojekt URL és publishable kulcs a Work chatben; titkos/service role kulcs nem szükséges és tilos a böngészőben.
2. A supabase/cloud-core.sql egyszeri migrációját ellenőrizd és futtasd a kiválasztott tesztprojekt SQL szerkesztőjében. Ez még nem lett végrehajtva. Meglévő táblát nem dob el; ütköző objektumnál a tranzakció megáll.
3. Auth alatt hozz létre/megerősíts egy tesztfiókot; email/jelszó bejelentkezés legyen engedélyezve. Jelszót csak az alkalmazás bejelentkező felületén adj meg.
4. SQL: RLS saját user_id szerinti olvasás; anon számára nincs hozzáférés; authenticated számára nincs közvetlen írás/törlés. Kizárólag a szűk, rögzített search_path-pal és auth.uid()-val dolgozó RPC írhat a saját sorba, elvárt revízióval. Más user_id nem adható át.

## Ellenőrzés
Automatizált Node VM szimuláció: kezdeti írástilalom, választás, feltöltés, helyi változás feltöltése, távoli betöltés és memóriafrissítés, kétoldali konfliktus, elavult előnézet, kvótahibánál megállás, offline megőrzés, leállítás, jelszómező ürítése, hibás adat elutasítása. A JavaScript szintaxisellenőrzés is lefutott.
Futtatás a projekt gyökeréből: node tests/cloud-core.test.cjs
Ezek szimulált tesztek; nincs valódi böngészős UI/PWA vagy PostgreSQL végrehajtási bizonyíték.

Kötelező következő tesztek külön tesztadatokkal:
- Két külön auth user: másik mentésének olvasása és írása nem lehetséges; anon olvasás/írás, közvetlen insert/update/delete tiltott.
- Üres felhő első feltöltése csak választással; eltérő PC/telefon esetén egyik sem ír felül automatikusan.
- PC→telefon és telefon→PC profil, Quest, Training és streak változások JSON nélkül.
- Offline módosítás, visszakapcsolódás; két egyidejű revízió írásából csak egy sikerül; másik konfliktust jelez.
- Hálózat megszakad szerverírás után: következő összehasonlítás nem írja felül a másik állapotot.
- Tárolókvóta, régi Training nélküli mentés, hibás távoli payload, aktív szerkesztés, frissítés/újranyitás, backup-helyreállítás.
- Telefonos PWA megjelenés, cache frissítés és offline indulás.

PASS kizárólag a felhasználói teszt és a valódi kapcsolat bizonyítása után mondható ki.

Források: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/getting-started/api-keys ; https://supabase.com/docs/guides/auth/passwords
