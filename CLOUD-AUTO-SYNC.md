# Cloud Core 1.2 – automatikus folytatás

A sikeres első bejelentkezés után a Supabase session (access és refresh token), a projekt nyilvános konfigurációja és az utolsó közös snapshot ezen az eszközön localStorage-ban megmarad. Jelszó nem kerül mentésre. Ez szükséges az újranyitás utáni automatikus kapcsolódáshoz. A kijelentkezés törli a megjegyzett kapcsolatot; a rendszeradatokat és biztonsági másolatokat nem törli.

Újranyitáskor automatikus tokenfrissítés és összehasonlítás indul. Azonos állapotnál nincs választás. Csak helyi változás feltöltődik, csak távoli változás letöltődik és a UI frissül. Offline a helyi mentés megmarad; visszatéréskor folytatódik. Két eltérő módosításnál továbbra sincs automatikus teljes felülírás. Az időbélyeg nem írhatja felül a másik eszköz Questjeit, Trainingjét vagy napi historyját. A napi indulási mentés is lehet valódi helyi változás.

A jelenleg már eltérő PC/telefon/felhő állapotot az első átálláskor külön exportok alapján egyszer egyeztetni kell. A build nem egyesíti automatikusan az XP-t, streaket és Quest pipákat. Korábbi mentett kapcsolat hiányában egyszer be kell jelentkezni. Hibás/lejárt visszavont sessionnél ismételt belépés kellhet.

Az új PWA cache neve: akos-system-cloud-auto-20261031-1. A megnyitott felületen BUILD 1.2 jelenjen meg. A develop frissítése önmagában nem módosítja a mainről kiszolgált alkalmazást. Main kiadás előtt valós felhasználói teszt szükséges.

Automatizált szimuláció: újranyitáskor távoli letöltés kézi választás nélkül; újranyitáskor helyi módosítás feltöltése; lejárt token megújítása; kétoldali konfliktus adatmegőrzése; korábbi két Quest, Training, auth és kvótavédelmek. Valódi Supabase/PWA/PC–telefon próba még nincs igazolva.

Felhasználói teszt másolt adatokkal: egyszeri belépés és közös alap után bezárás/újranyitás, telefonos Quest -> PC automatikus letöltés, PC-s Quest -> telefon letöltés; revision növekedés, history/Training/streak megőrzés; offline módosítás; éjfél utáni indulás; eltérő kétoldali módosítás. Két böngészőfül helyett eszközönként egy fül használata javasolt a meglévő helyi mentési korlát miatt.
