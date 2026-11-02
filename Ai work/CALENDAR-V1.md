# Calendar V1.1 — használat és ellenőrzés

Elérés: Modules → Calendar. A modul a Monarch felületet és az aktuális kék/arany/crimson témát követi.

## Mit tud?
- Havi nézet, napválasztás, napi eseménylista; a hét első napja a System beállítását követi.
- Saját esemény, edzés, quest határidő és emlékeztető létrehozása/szerkesztése/törlése. Egész nap vagy kezdő/befejező időpont; megjegyzés és kapcsolt quest.
- A beállított heti edzésnapokat, az edzésnaplót, Cardio bejegyzéseket és az aktív edzéspiszkozatot a forrásadatokból jeleníti meg. Mindegyiken Szerkesztés gomb van: egy adott alkalom címe, dátuma, időpontja, típusa és megjegyzése naptári módosításként menthető. A Training napló és heti beállítás nem változik; az eredeti alkalom nem duplikálódik. Az Eredeti visszaállítása törli a naptári módosítást, és visszahozza az eredeti megjelenést.
- A naptári Kész/Undo külön státusz: nem ad XP-t és nem módosítja a quest teljesítését. A kapcsolt quest tényleges állapota külön látszik.
- A naptár a teljes System mentés része, így a meglévő Cloud Core teljesmentés-szinkronjával utazik. Régi, naptár nélküli System backup/Cloud payload nem törli a meglévő naptárat.

## ChatGPT-fájl körút
1. JSON letöltés. Ugyanaz a JSON a „szöveges másolat” részben is elérhető.
2. Add át a fájlt vagy a másolatot a ChatGPT-nek, és írd le a módosításokat.
3. A ChatGPT csak az events listát módosítsa. A baseEvents maradjon változatlan; a meglévő esemény id értékét tartsa meg. Új eseményhez új, egyedi id szükséges.
4. Feltöltés: a program először felsorolja a létrehozásokat, módosításokat és törléseket, a régi és új adatokkal együtt.
5. Csak a Változások alkalmazása után történik mentés. Mégse esetén nincs változás. Az eltérő helyi módosítások ütközésnél megállítják az importot; exportálj új fájlt.

A context.trainingOccurrences az előző 30 és következő 90 nap legfeljebb 500 edzésalkalmának referenciáit tartalmazza. Ezek naptári szerkesztéséhez az events listába új eseményt kell felvenni a megfelelő sourceRef értékkel; a későbbi szerkesztéseknél ezt meg kell őrizni. Egy forrásalkalomhoz csak egy naptári módosítás tartozhat. A context csak olvasási háttéradat; nem módosít edzéstervet, questet vagy XP-t. Az events listából kivett, a baseEvents listában szereplő esemény törlésjavaslat. A változatlan események nem írják felül az időközben történt helyi változásokat. Azonos import ismétlése nem duplikál.

Példakérés a ChatGPT-nek: „A csatolt Shadow Calendar V1 JSON events listájában tedd át a megbeszélést péntek 15:00-ra, és adj hozzá egy edzést szombat 10:00-ra. A baseEvents és a meglévő id értékek maradjanak változatlanok. Kizárólag érvényes JSON-t adj vissza.”

Esemény mezők: id, title, date (YYYY-MM-DD), time (HH:MM vagy üres), endTime (HH:MM vagy üres), kind (event/training/quest/reminder), note, questId (vagy üres), completed (boolean), sourceRef (opcionális forráshivatkozás, egyébként üres). Dátumtartomány 1900–2100. Egy esemény ugyanazon napon végződik. Az időpontok az eszköz helyi idejét jelentik; nincs időzóna-átváltás. A naptár nem küld push értesítést. Legfeljebb 2000 saját esemény és 500 KB naptáradat; importfájl legfeljebb 1,5 MB.

## Teszteredmények
- 15 Node tesztfájl PASS: meglévő Quest, Training, Player, Cloud, offline regressziók; új Calendar validálás, régi mentések, fájl-egyesítés, törlés, ismételt import és ütközés.
- Valódi, elkülönített Chrome böngészőben: navigáció, bejegyzés létrehozás/szerkesztés/törlés és törlés megszakítása, Kész, szöveg escaping, questkapcsolat, újratöltés, tényleges export JSON, import Mégse/jóváhagyás, quota és újabb helyi mentés védelme; 320/390px szélességnél nincs vízszintes túlcsordulás; offline cache-ből újranyitás; nincs JavaScript hiba.
- A tesztböngésző natív fájlletöltése „canceled” eredménnyel zárult. A letöltési kérés és az ugyanazzal a kóddal előállított másolható JSON ellenőrizve, azzal a teljes importkörút sikeres. A saját böngésződben a natív letöltést még ellenőrizni kell.
- Tényleges Cloud Core kód két eszköz szimulációjával: offline mentés/reconnect, naptár letöltése a másik eszközre, változatlan jutalmak/Training, régi kliens adatainak megtartása, eltérő offline szerkesztések ütközése PASS. Élő Supabase/RLS és valódi telefonos Cloud próba nem történt.
- Az offline böngészőpróba külön tesztkörnyezetben regisztrálta a service workert; a fejlesztői localhoston a meglévő app normálisan szándékosan kikapcsolja azt.

## Felhasználói PASS előtt
Nézd meg a Modules → Calendar oldalt mindhárom színben, adj hozzá saját próbaeseményt és questhatáridőt, próbáld a fájlos export/szerkesztés/import körutat. Külön teszt Cloud-adatokkal ellenőrizd a PC–telefon szinkront és az offline újranyitást. Main csak külön PASS után.

V1.1 ellenőrzés: két, szöveg nélküli, 44×44-es SVG import/export gomb akadálymentes címkével. Valódi böngészőben a heti edzésalkalom áthelyezése, újraszerkesztése, visszaállítása, valamint validált befejezett edzés, Cardio és aktív draft naptári szerkesztése is PASS; a Training forrásadatok változatlanok. JSON sourceRef megőrzés, duplikált módosítás tiltása és eredeti helyen történő elrejtés egységtesztje PASS.
