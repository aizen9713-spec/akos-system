# SHADOW OS Quest V2 — Build 1

Állapot: develop tesztbuild, main kiadás és felhasználói PASS nélkül.

## Repo audit
- Eredeti helyi projekt: C:\Users\KomPhone\Documents\Ákos System app.
- Kiinduló helyi main/develop: b031023. GitHub main és develop: 42e5593.
- A helyi és távoli követett tartalom sorvégződésektől eltekintve azonos volt. A konfliktusos fájlokat egyenként összehasonlítottuk, mind azonos. Mindkét előzményt megőrző merge: 00380d5.
- Teljes induló másolat: e chat work/akos-system könyvtára. Az eredeti 9 dokumentumtörlés és az Ai work mappa változatlanul helyi, nem kerül a fejlesztési commitba.
- A helyi main ágat nem módosítottuk. Csak a develop kap fejlesztést.

## Változások
- Theme-változókat használó Quest Control fejléc, kártyák, reszponzív eszköztár és AI Inbox.
- Két szöveg nélküli SVG download/upload gomb, tooltip és aria-label.
- Új Custom Quest létrehozása, cím/XP szerkesztése. Teljesített custom quest szerkesztése és törlése tiltott; előbb Undo szükséges. A core questek nem szerkeszthetők/törölhetők.
- A régi, eredetjelölés nélküli questek konzervatívan védettek maradnak. A korábbi teljesítések, XP és streak nem kerül átírásra.
- Az új custom questek napi váltás után is megmaradnak, egyszer teljesíthetők; nem napi ismétlődő sablonok.
- AI forrású import külön Inboxba érkezik: APPROVE vagy DISMISS. Jóváhagyás sem ad XP-t. Nincs automatikus AI-generálás/API-hívás.
- shadow-quests.json: format=shadow-quests, version=1. Csak definíciók, nem játékosadatok vagy teljesítések. Core questek nem exportálhatók ebben a fájlban; teljes mentéshez System JSON használható.
- Kötelező importelőnézet, tételes új/kihagyott lista és CONFIRM ADDITIONS. Cancel/Escape nem ment. Alapból csak hozzáadás; Build 1-ben felülírás egyáltalán nem elérhető.
- ID- és normalizált címütközések kihagyása, fájlon belüli duplikációvédelem. Maximum 200 quest, 256 KB, egész 1–100 XP. Ismeretlen verzió/hibás definíció esetén teljes elutasítás. Importált reward map és completed mező nem kerül alkalmazásra.
- Az előnézet óta változott mentésnél új előnézet szükséges. Tárolási hibánál az új import/jóváhagyás/szerkesztés visszaállítja a memóriabeli állapotot.
- Az új adatok ugyanabban a state-ben és localStorage-ban vannak, így a teljes System JSON és Cloud Sync továbbítja őket. Service worker verzió és offline fájllista frissült.

## Ellenőrzés
Minden tests/*.cjs teszt sikeresen lefutott. Új modell- és valódi importkezelő tesztek: core/progress védelem, AI-jóváhagyás, hibás fájl, duplikáció, export/import, Cancel, elavult mentés, tárolási hiba és XP-védelem. A tényleges Cloud Sync kóddal szimulált PC→telefon import és telefon→PC jóváhagyás is PASS. A meglévő Training és Quest Undo tesztek is PASS. JavaScript szintaxis és git diff --check rendben.
Böngészős vizuális próba és valódi Supabase/PC–telefon próba még nem történt; ezekhez felhasználói teszt szükséges.

## Felhasználói teszt
1. Develop verzióban készíts System JSON biztonsági mentést. Jegyezd fel az XP-t, streaket és egy teljesített core questet.
2. Quest oldalon ellenőrizd az új fejlécet, a két kis ikongomb tooltipjét és billentyűzetes fókuszát. Nézd meg mindhárom theme-ben és telefonméretben.
3. Hozz létre egy saját questet, szerkeszd a címét/XP-jét. Teljesítsd egyszer: csak egyszer kapj jutalmat. Teljesített állapotban Edit/Delete tiltott; Undo után ismét elérhető.
4. Download: shadow-quests.json letöltés. Upload: előnézet, majd Cancel — semmi ne változzon. Újra importálva a saját exportot minden meglévő tétel legyen kihagyott, XP ne változzon.
5. Importáld a mellékelt AI mintát. Előnézetben AI Inbox cél legyen látható; jóváhagyás után csak az Inboxba kerüljön. APPROVE tegye aktívvá, XP nélkül. Ismételt import ne duplikáljon.
6. Frissítsd az oldalt, majd exportálj és állíts vissza egy teljes System JSON mentést. A custom quest és Inbox maradjon meg; az eredeti core teljesítés/XP/streak legyen helyes.
7. PC-n importálj, telefonon ellenőrizd; telefonon hagyd jóvá az AI-javaslatot, PC-n ellenőrizd. Mindkét eszközön ugyanaz a develop verzió fusson. Offline ütközésnél továbbra is külön adatforrás-választást várj.
8. Ellenőrizd, hogy a Training Cardio/Recovery adatok megmaradtak. Main kiadás csak külön felhasználói PASS után.
