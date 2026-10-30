# Cloud Sync diagnózis és javítás – 2026-10-30

Állapot: felhasználói PC–telefon teszt szükséges. Éles adatcsere nem történt.

## Ellenőrzött tények
- GitHub main: a91584f; develop kiindulás: da42bd2, öt committal main mögött. Az elkülönített develop másolat mainre fast-forwardolva, így a kiadott Training-javítások megmaradnak.
- Eredeti helyi projekt: C:/Users/KomPhone/Documents/Ákos System app; tiszta main, a91584f.
- Quest completeQuest -> saveState -> localStorage, teljes állapot mentése. A Cloud Core 5 másodpercenként hasonlít; nem csak alap statokat küld, a Training is része a snapshotnak.
- Access/refresh token csak memóriában él. Újranyitás, PWA-frissítés, oldalfrissítés után nincs session, tehát nincs fel- vagy letöltés. Ez lehetséges magyarázat, az adott telefonos esetben nem bizonyított.
- Kétoldali eltérésnél explicit választás kell. A másik eszköz napi/indulási mentése is okozhat eltérést. Nem készült automatikus merge vagy forrásválasztás.
- Supabase RPC expected_revision alapú atomikus írás; RLS user szerinti olvasás. Az aktuális élő sor, két eszköz userazonossága, sessionje és revisionje nem volt elérhető hitelesített futásból.
- A service worker cache-first; új cache-azonosító készült. Supabase más origin, nem kerül a PWA cache-be. A frissítéshez a felhasználónak az új buildet aktiválnia kell; ez megszünteti a memóriabeli sessiont.
- Bizonyított kódhiba: Training nélküli távoli mentésnél a Training csak memóriában maradt meg, localStorage-ból hiányzott. Javítva: a migrált, megőrzött teljes állapot kerül tartós tárolásba. A baseline a távoli payload marad; a megőrzött Training következő összehasonlításkor helyi változásként kezelhető, CAS védelemmel.

## Javítás
A Cloud Core 1.1 diagnózis sessiont, helyi kipipált Quest-számot, revisiont, utolsó olvasási/feltöltési/UI-frissítési időt és hibát mutat, tokenek nélkül. Az előnézet a kész Questek ID-ját és címét is tartalmazza. 401/403 esetén a kapcsolat leáll, új belépés/jogosultság-ellenőrzés kell. Ablakfókusz és láthatóvá válás új összehasonlítást indít. A session szándékosan továbbra sem kerül tartós tárolóba.

## Adatmegőrzés és felhasználói ellenőrzés
1. Mielőtt frissítesz vagy belépsz: a telefonon és PC-n külön teljes rendszerexport, valamint külön Training-export készüljön. Ezeket külön néven őrizd meg. Ne töröld a böngésző/PWA adatait, és ne importálj vissza semmit diagnózis céljából.
2. A két eredeti kipipált Questet nézd meg a telefonon. Ha hiányoznak, állj meg; az exportokat és korábbi shadow-cloud-v1:backup mentéseket kell összehasonlítani, nem újabb forrást választani.
3. Az új buildet külön tesztkörnyezetben, másolt tesztadatokkal ellenőrizd. Eszközönként egy fül. Frissítés után Cloud Core 1.1 legyen látható; a régi felület régi cache-t jelezhet. Tárhelytörlés nem szükséges.
4. Mindkét eszköz ugyanazon tesztprojekt ugyanazon tesztfiókjával lépjen be. Az első választást csak a két export összevetése után végezd el. A jelenlegi PC és telefon eltérő teljes állapotánál ne válassz vakon helyi/felhő forrást.
5. Közös tesztalapról, nyitott bejelentkezett eszközökön két teszt-Quest kipipálása telefonon: nőjön a helyi számláló, majd 5 másodperc után a revision és feltöltési idő. PC-n nőjön az olvasott revision és UI-frissítési idő, és jelenjen meg a két pipa. Ellenőrizd az XP-t, historyt és Traininget is.
6. Ha nincs session: auth/újranyitás. Ha helyi szám változik, revision nem: feltöltés, offline, auth, RPC vagy választási várakozás. Ha telefon revision nő, PC nem olvassa: PC session/hálózat/eltérő fiók vagy projekt. Ha PC revision nő, UI-idő nem: konfliktus vagy aktív szerkesztő. Ha UI-idő nő, de pipa nincs: összevetendő a két Quest ID és payload; UI vagy eltérő napi adatok vizsgálata kell.
7. Kétoldali eltérő módosításnál nincs automatikus írás; mindkét adat megmaradjon és jelenjen meg a választás. Offline, újranyitás, lejárt/hibás auth, régi Training nélküli mentés, PWA frissítés is ellenőrizendő.

Automatizált Node VM szimuláció lefutott: eredeti védelmek, két Quest feltöltése, revision kijelzés, fókusz utáni letöltés, Training tartós megőrzése, auth elutasítás melletti adatmegőrzés. Szintaxis és diff ellenőrzés lefutott. Valódi Supabase/RLS, böngészős UI és telefonos teszt még nincs igazolva. Mainre nem került módosítás.
