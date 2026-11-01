TRAINING SYSTEM BUILD 2 — develop tesztbuild, 2026-11-01

Audit: eredeti helyi main/develop 83243da, tiszta munkakönyvtár; GitHub main/develop 6b83a7d. A 15 helyi commit előzménye a teljes másolatban megőrizve. A GitHubhoz képesti korábbi különbségek többsége sorvég-normalizálás; ezeket a fejlesztés nem dobja el.

CARDIO: futás, gyaloglás, ugrókötél, egyéb; dátum, idő percben (tizedes is), táv km-ben (0, ha nem mért), számított perc/km, opcionális pulzus és 1–10 intenzitás, jegyzet, aktivitásonkénti rekordok, történet, törlés megerősítéssel.
RECOVERY: dátum, alvás órában, energia/fáradtság/izomfájdalom 1–5, napló; azonos dátum új mentése frissíti a napi sort. 7 naptári nap átlaga és előző 7 nap összevetése legalább 3–3 bejegyzéssel; jövőbeli dátum nem kerül a trendbe. Nem orvosi visszajelzés.

Az adatok a state.training.cardio és recovery mezőkben vannak. Meglévő teljes mentés és felhőszinkron tartalmazza őket. Training V1 JSON formátum bővül opcionális mezőkkel, a régi JSON import működik. Training import azonos ID eltérésnél leáll; teljes System import továbbra is megerősített visszaállítás. Régi System/Cloud mentés hiányzó új mezői megőrzik a helyi Build 2 adatokat. Ismeretlen mezőket a validátor megtartja. Korábbi appverzióban új mentés szerkesztése nem ellenőrzött; mindkét eszközt frissíteni kell.

Futtatott tesztek: node tests/cloud-core.test.cjs; node tests/cloud-two-device.test.cjs; node tests/quest-undo.test.cjs; node tests/training-build2.test.cjs. Éles localStorage-t és Supabase-t nem használnak.
A két eszközös teszt tényleges Cloud Core kódot futtat külön memóriával és tárral, közös szimulált felhővel. PC az egyik Questet, telefon a másikat módosítja egyszerre offline. Újracsatlakozás után a második eszköz választást kér, mindkét teljes mentés változatlan marad. Ez konfliktusvédelem, nem automatikus Quest-egyesítés. Explicit forrásválasztás teljes mentést választ; ne várj automatikus összefésülést.

Minimális felhasználói ellenőrzés külön tesztmentéssel:
1. Develop build mindkét eszközön: Cardio 25 perc / 5 km → 5:00 min/km; ugrókötél táv 0 → nincs tempó.
2. Recovery napi bejegyzés mentése, ugyanazon nap módosítása; History megnyitása és választott Theme/Background ellenőrzése mobilon.
3. Offline mentés, újratöltés, majd internet után a másik eszközön megjelenés.
4. Training JSON export/import: új adatok és régi Workout History megmaradnak.

Korlát: Supabase/RLS élő teszt és fizikai telefonos UI/PWA próba nincs ebben az automatizált tesztben. User PASS és main release nincs.
