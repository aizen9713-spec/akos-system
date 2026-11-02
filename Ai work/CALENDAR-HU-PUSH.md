# Magyar ünnepnapok és telefonos emlékeztetők — 2026-11-02

## Elkészült ünnepnapi réteg
A naptár Ü/P/M betűvel, külön élkiemeléssel, valamint a napi listában teljes névvel jelöli a magyar munkaszüneti napokat, a húsvét- és pünkösdvasárnapot, a 2026-os áthelyezett pihenőnapokat és ledolgozós szombatokat. A forrásadatok nem saját események, nem módosítják a mentést, a Traininget vagy az XP-t. Mindegyikhez forráslink tartozik.

A jelenlegi munkaszüneti szabályok szerinti ismétlődő dátumok 2026–2100 között számolódnak. Ez nem jövőbeli jogszabályok előrejelzése. Az ellenőrzési dátum látszik a felületen. Az éves áthelyezések csak 2026-ra vannak ellenőrizve és betöltve. Más évben ezt külön kiírja; nem feltételez automatikusan ledolgozós szombatot vagy szabad december 24-ét. Általános munkarend szerinti országos tájékoztatás, nem személyes munkahelyi beosztás. A tetszőleges emlék- és jeles napok nem részei a munkaszüneti rétegnek.

Források:
- Mt. 102. §, 2026. október 1-től hatályos időállapot: https://net.jogtar.hu/jogszabaly?docid=a1200001.tv
- 10/2025. (IV. 30.) NGM rendelet: https://net.jogtar.hu/jogszabaly?docid=a2500010.ngm

2026-os éves kivételek: január 2. pihenőnap / január 10. munkanap; augusztus 21. pihenőnap / augusztus 8. munkanap; december 24. pihenőnap / december 12. munkanap.

## Mi kell a push emlékeztetéshez?
A meglévő alkalmazás PWA-alapja (manifest és service worker) jó kiindulás. Push küldés még nincs implementálva vagy bekapcsolva.

1. HTTPS alatt elérhető app és kompatibilis telefonos böngésző/PWA. iPhone/iPad esetén iOS/iPadOS 16.4+ és Főképernyőhöz adott app szükséges.
2. Felhasználói gombnyomásra kért értesítési engedély és eszközönkénti Web Push feliratkozás. Leiratkozás és tesztértesítés.
3. Szerveroldali, védett előfizetés- és emlékeztető-táblák azonosított felhasználóhoz kötve; VAPID privát kulcs csak szervertitokként. A meglévő teljes mentés nem értesítési várólista.
4. Ütemező és pushküldő, például Supabase Cron + Edge Function. Percenkénti feladat a lejáró emlékeztetőket ellenőrzi. Eseményenként kikapcsolható / 0 / 10 / 30 / 60 perc / 1 nap értesítés. Alapértelmezés lehet 30 perc. Egész napos eseményhez külön időpont kell.
5. A Calendar jelenleg eszközhelyi dátumot/időt tárol. A küldéshez rögzíteni kell az IANA időzónát (alapértelmezés Europe/Budapest), és abból UTC küldési időt számolni, a nyári/téli időváltás kezelése mellett.
6. Mentés/import/módosítás/törlés után az időzített feladat frissül vagy törlődik; egyedi kulcs és küldési napló akadályozza meg a duplázást. Lejárt eszközfeliratkozás törlendő, átmeneti hibák újrapróbálhatók.
7. Service worker push és notificationclick kezelő: kattintás a megfelelő naptári napot nyitja meg. A meglévő offline cache és manuális appfrissítés viselkedése megmarad.

Példa: a 18:00-s eseményhez 30 perces emlékeztető → 17:30 körül telefonos értesítés akkor is, ha az app nincs előtérben. Internet és rendszerengedély szükséges; az operációs rendszer és a hálózat miatt másodpercre pontos kézbesítés nem garantálható. Az appon belüli időzítő bezárt appnál nem helyettesíti a szerveres küldést.

A következő élesítési lépés külön tesztprojektben a táblák, kulcsok, ütemező és eszközfeliratkozás kialakítása, majd Android/iPhone valós készülékes teszt. A jelen munkában nem változott éles Cloud-szolgáltatás és nem kértünk értesítési engedélyt.

Technikai források:
- https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
- https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- https://supabase.com/docs/guides/cron

## Ellenőrzés
16 Node tesztfájl PASS. Ünnepnapteszt: 11 törvényi munkaszüneti nap + 2 ünnepvasárnap, a hat 2026-os áthelyezés, 2027-es mozgó ünnepek, 2026–2100 érvényes dátumok, nem igazolt 2027-es áthelyezések hiánya, a gyorsítótár módosításvédelme. Valódi izolált Chrome-próba: ünnep jelölése és napi neve, forráslink, országos adatokhoz nincs eseményszerkesztő; december 24. pihenőnap és december 12. munkanap; 2027-es lefedettségi figyelmeztetés; meglévő CRUD/import/mobil/offline regresszió PASS. A natív fájlletöltést a tesztböngésző továbbra is megszakítja; a tényleges exportált JSON másolata és importkörútja ellenőrizve.
