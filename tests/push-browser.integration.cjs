const {chromium}=require("./dependency.cjs")("playwright");
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
let legacyWorker=false;
const root=process.cwd();const server=http.createServer((req,res)=>{if(legacyWorker&&new URL(req.url,'http://local').pathname==='/sw.js'){res.setHeader('Content-Type','text/javascript');res.setHeader('Cache-Control','no-store');return res.end("self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});");}let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!p.startsWith(root+path.sep)&&p!==root)return res.writeHead(403).end();if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');fs.readFile(p,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'})[path.extname(p)]||'application/octet-stream');res.end(b)});});


(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;const browser=await chromium.launch({headless:true,...(process.env.PUSH_TEST_CHROME?{executablePath:process.env.PUSH_TEST_CHROME}:{})});try{
 const context=await browser.newContext({viewport:{width:1365,height:1000}});await context.addInitScript(()=>{
 window.__permission='default';window.__permissionCalls=0;window.__nextPermission='granted';Object.defineProperty(Notification,'permission',{get:()=>window.__permission});Notification.requestPermission=async()=>{window.__permissionCalls++;window.__permission=window.__nextPermission;return window.__permission;};
 PushManager.prototype.getSubscription=async()=>window.__sub||null;PushManager.prototype.subscribe=async function(options){window.__sub={options:{applicationServerKey:options.applicationServerKey},endpoint:'https://fcm.googleapis.com/send/mock',toJSON:()=>({endpoint:'https://fcm.googleapis.com/send/mock',keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}}),unsubscribe:async()=>{window.__sub=null;return true;}};return window.__sub;};
 });let remote=null,revision=0,enabled=false,testCount=0,backendReady=false;const actions=[],page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://test.supabase.co/**',async route=>{const req=route.request(),url=req.url(),b=req.postDataJSON();let value;
 if(url.includes('/auth/'))value={access_token:'fake-access',refresh_token:'fake-refresh',expires_in:3600,user:{id:'00000000-0000-4000-8000-000000000001',email:'test@example.test'}};
 else if(url.includes('/functions/v1/shadow-push')){actions.push(b.action);if(b.action==='config'&&!backendReady){await route.fulfill({status:503,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({error:'push_not_configured'})});return;}if(b.action==='config')value={publicKey:'BGlcpMzoNJsaO4Kk2u6QmdfZvih8PVxR_rrxB90La6PFOdNgXBkXj4rpBn_xruyi6TDvq5Er2SFtQG5MEcFVAeo'};if(b.action==='register'){enabled=true;value={registered:true,enabledDevices:1,pending:0};}if(b.action==='status')value={registered:enabled,enabledDevices:enabled?1:0,pending:0};if(b.action==='disable'){enabled=false;value={registered:false};}if(b.action==='test'){testCount++;value={accepted:true};}}
 else if(url.includes('/rpc/shadow_cloud_write')){remote=b.new_payload;value=++revision;}
 else value=remote?[{revision,payload:remote}]:[];
 await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify(value)});
 });
 await page.goto('http://127.0.0.1:'+port+'/');await page.locator('#cloud-relogin').waitFor({state:'visible'});assert.equal(await page.locator('#cloud-relogin-submit').isDisabled(),true);await page.locator('#cloud-connection-settings').click();assert.equal(await page.locator('#notificationsPanel').getAttribute('open'),null);await page.locator('#notificationsPanel>summary').click();assert.equal(await page.evaluate(()=>window.__permissionCalls),0);await page.locator('#pushEnable').click();assert.equal(await page.evaluate(()=>window.__permissionCalls),0);assert.ok((await page.locator('#pushStatus').innerText()).includes('Sign in'));
 await page.locator('#cloud-test-project').check();await page.locator('#cloud-url').fill('https://test.supabase.co');await page.locator('#cloud-key').fill('sb_publishable_test');await page.locator('#cloud-email').fill('test@example.test');await page.locator('#cloud-password').fill('test-only');await page.locator('#cloud-login').click();await page.locator('#cloud-choices').waitFor({state:'visible'});page.once('dialog',d=>d.accept());await page.locator('#cloud-local').click();await page.waitForFunction(()=>document.getElementById('cloud-status').textContent.includes('rev'));
 await page.locator('.nav-btn[data-page="dashboard"]').click();
 assert.equal(await page.getByRole('tab',{name:'Overview'}).getAttribute('aria-selected'),'true');
 await page.locator('#coreTabDaily').click();
 const beforePlan=await page.evaluate(()=>JSON.parse(localStorage.getItem(STORAGE_KEY)));
 await context.setOffline(true);
 await page.locator('#coreFocus').fill('Practice one focused session');
 await page.locator('[data-priority]').nth(0).fill('Manual priority');
 await page.getByRole('button',{name:'Save plan',exact:true}).click();
 assert.match(await page.locator('#corePlanStatus').innerText(),/Plan saved/);
 const afterPlan=await page.evaluate(()=>JSON.parse(localStorage.getItem(STORAGE_KEY)));
 const {corePlan,lastSavedAt,...afterFields}=afterPlan;
 const {lastSavedAt:oldSaved,...beforeFields}=beforePlan;
 assert.deepEqual(afterFields,beforeFields);
 assert.equal(Object.values(corePlan.days)[0].priorities[0],'Manual priority');
 await page.locator('#coreFocus').fill('Unsaved text');
 await page.evaluate(()=>CoreCommand.render());
 assert.equal(await page.locator('#coreFocus').inputValue(),'Unsaved text');
 await page.locator('#coreReloadPlan').click();
 assert.equal(await page.locator('#coreFocus').inputValue(),'Practice one focused session');
 await page.locator('#coreFocus').fill('Quota attempt');
 await page.evaluate(()=>{window.__originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===STORAGE_KEY)throw new DOMException('Full','QuotaExceededError');return window.__originalStorageSet.call(this,key,value);};});
 await page.getByRole('button',{name:'Save plan',exact:true}).click();
 assert.match(await page.locator('#corePlanStatus').innerText(),/Plan not saved/);
 await page.evaluate(()=>{Storage.prototype.setItem=window.__originalStorageSet;});
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem(STORAGE_KEY))),afterPlan);
 await page.locator('#coreReloadPlan').click();
 await context.setOffline(false);
 await page.locator('#coreTabDaily').focus();
 await page.keyboard.press('ArrowLeft');
 assert.equal(await page.locator('#coreOverview').isVisible(),true);
 assert.ok(await page.locator('#growthSnapshot').isVisible());
 await page.keyboard.press('End');
 assert.equal(await page.locator('#coreWeekly').isVisible(),true);
 assert.match(await page.locator('#coreWeekQuests').innerText(),/completed/);
 await page.setViewportSize({width:320,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#coreTabDaily').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const [button,target] of [['coreNewQuest','questInput'],['coreNewEvent','calendarForm'],['coreOpenTraining','training-workspace'],['coreCheckIn','recovery-workspace']]){
  await page.locator('#'+button).click();
  assert.ok(await page.locator('#'+target).isVisible(),button+' should open '+target);
  if(button==='coreNewEvent')await page.locator('#calendarCancel').click();
  await page.locator('.nav-btn[data-page="dashboard"]').click();
 }
 await page.setViewportSize({width:1365,height:1000});
 await page.getByRole('button',{name:'Open system settings'}).click();
 console.log('PASS: CORE tabs, offline plan, quota rollback, preserved save, 320px and all quick actions.');
 await page.evaluate(()=>window.__nextPermission='denied');await page.locator('#pushEnable').click();await page.waitForFunction(()=>document.getElementById('pushPermission').textContent==='denied');assert.ok((await page.locator('#pushStatus').innerText()).includes('not allowed'));assert.equal(actions.includes('register'),false);
 await page.evaluate(()=>{window.__permission='default';window.__nextPermission='granted';});await page.locator('#pushEnable').click();await page.waitForFunction(()=>document.getElementById('pushStatus').textContent.includes('Push keys are not configured'));assert.ok(await page.evaluate(()=>!!CloudNotifications.identity()));backendReady=true;await page.locator('#pushEnable').click();await page.waitForFunction(()=>document.getElementById('pushSummary').textContent==='Enabled on this device');assert.ok(actions.includes('register'));await page.locator('#notificationsPanel details > summary').click();await page.locator('#pushUpdateWorker').click();await page.waitForFunction(()=>document.getElementById('pushStatus').textContent.includes('current and responding'));await page.locator('#pushTest').click();await page.waitForFunction(()=>document.getElementById('pushStatus').textContent.includes('Test accepted'));assert.equal(testCount,1);
 await page.evaluate(async()=>{const values=await Promise.all(Array.from({length:3},()=>CloudNotifications.call({action:'status',deviceId:localStorage.getItem('shadow-push-device-v1')})));if(!values.every(v=>v.registered))throw Error('Concurrent push status requests failed');});
 await page.getByRole('button',{name:'MODULES',exact:true}).click();await page.getByRole('button',{name:'Open Calendar module',exact:true}).click();await page.locator('#calendarNew').click();assert.equal(await page.locator('[name=reminder]').inputValue(),'none');await page.locator('#calendarForm [name=title]').fill('Push event');await page.locator('#calendarForm [name=date]').fill('2026-11-03');await page.locator('#calendarForm [name=time]').fill('18:00');assert.equal(await page.locator('[name=reminder]').inputValue(),'30');await page.locator('[name=reminder]').selectOption('15');await page.locator('#calendarForm [type=submit]').click();const reminder=await page.evaluate(()=>state.calendar.events.find(e=>e.title==='Push event'));assert.equal(reminder.notification.offsetMinutes,15);assert.equal(reminder.notification.timeZone,'Europe/Budapest');
 // All-day reminders have an explicit anchor; editing a legacy event stays opted out.
 await page.locator('#calendarNew').click();await page.locator('#calendarForm [name=title]').fill('All day reminder');await page.locator('#calendarForm [name=date]').fill('2026-11-04');await page.locator('[name=reminder]').selectOption('0');await page.locator('[name=allDayTime]').fill('08:30');await page.locator('#calendarForm [type=submit]').click();assert.equal(await page.evaluate(()=>state.calendar.events.find(e=>e.title==='All day reminder').notification.allDayTime),'08:30');
 await page.evaluate(()=>{state.calendar.events.push({id:'legacy-test',title:'Legacy event',date:'2026-11-04',time:'10:00',endTime:'',kind:'event',note:'',questId:'',completed:false});saveState();render();});await page.locator('[data-edit="legacy-test"]').click();assert.equal(await page.locator('[name=reminder]').inputValue(),'none');await page.locator('#calendarForm [name=time]').fill('11:00');assert.equal(await page.locator('[name=reminder]').inputValue(),'none');await page.locator('#calendarForm [type=submit]').click();assert.equal(await page.evaluate(()=>'notification'in state.calendar.events.find(e=>e.id==='legacy-test')),false);
 await page.evaluate(id=>navigator.serviceWorker.dispatchEvent(new MessageEvent('message',{data:{type:'SHADOW_OPEN_CALENDAR',eventId:id,date:'2026-11-03'}})),reminder.id);assert.ok(await page.locator('#calendarHeading').isVisible());assert.ok((await page.locator('#calendarAgenda').innerText()).includes('Push event'));
 await page.getByRole('button',{name:'Open system settings'}).click();await page.locator('#pushDisable').click();await page.waitForFunction(()=>document.getElementById('pushStatus').textContent.includes('disabled on this device'));assert.equal(enabled,false);assert.equal(await page.evaluate(()=>window.__sub),null);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('shadow-push-owner-v1')).enabled),false);assert.deepEqual(errors,[]);
 await page.locator('#pushEnable').click();await page.waitForFunction(()=>document.getElementById('pushSummary').textContent==='Enabled on this device');await page.locator('#cloud-stop').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('shadow-push-owner-v1')).enabled===false);assert.equal(await page.locator('#pushSummary').innerText(),'Not enabled');
 await page.screenshot({path:path.resolve('work/push-browser-settings.png'),fullPage:true});for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 // A previously installed localhost worker must expose the update action and retain data.
 const updateContext=await browser.newContext(),updatePage=await updateContext.newPage();
 try{legacyWorker=true;await updatePage.goto('http://127.0.0.1:'+port+'/');await updatePage.locator('#cloud-offline').click();await updatePage.evaluate(async()=>{localStorage.setItem('update-preserve-check','retained');await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});await updatePage.waitForFunction(()=>!!navigator.serviceWorker.controller);legacyWorker=false;await updatePage.reload();await updatePage.locator('#cloud-offline').click();await updatePage.locator('#systemUpdatePanel').waitFor({state:'visible'});await updatePage.locator('#systemUpdateBtn').click();await updatePage.waitForFunction(()=>document.readyState==='complete'&&!!navigator.serviceWorker.controller);const result=await updatePage.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;return new Promise((resolve,reject)=>{const c=new MessageChannel(),t=setTimeout(()=>reject(Error('Updated localhost worker did not answer')),10000);c.port1.onmessage=e=>{clearTimeout(t);resolve(e.data)};reg.active.postMessage({type:'SHADOW_PUSH_DIAGNOSTICS'},[c.port2]);});});assert.equal(result.ok,true);assert.equal(await updatePage.evaluate(()=>localStorage.getItem('update-preserve-check')),'retained');console.log('PASS: existing localhost worker update offered, activated, new push receiver responds; local data retained.');
 await updatePage.setViewportSize({width:320,height:844});
 await updatePage.evaluate(()=>localStorage.setItem('shadow-cloud-v1:preferences',JSON.stringify({url:'https://test.supabase.co',key:'sb_publishable_test',email:'saved@example.test'})));
 await updatePage.evaluate(()=>CloudStorage.write({version:2,disabled:true}));
 await updatePage.reload();
 await updatePage.locator('#cloud-relogin').waitFor({state:'visible'});
 assert.equal(await updatePage.locator('#cloud-relogin-email').inputValue(),'saved@example.test');
 assert.equal(await updatePage.locator('#cloud-relogin-password').inputValue(),'');
 assert.ok(await updatePage.locator('#cloud-relogin').evaluate(dialog=>dialog.getBoundingClientRect().right<=innerWidth));
 await updatePage.locator('#cloud-offline').click();
 assert.equal(await updatePage.locator('#cloud-relogin').isVisible(),false);
 assert.equal(await updatePage.evaluate(()=>localStorage.getItem('update-preserve-check')),'retained');
 console.log('PASS: startup Monarch re-login at 320px, saved email, empty password and offline continuation.');}finally{legacyWorker=false;await updateContext.close();}
 console.log('PASS: real browser UI + actual worker/IndexedDB with mocked browser/provider transport: no unsolicited permission, denial-safe, Cloud auth reuse, register/test/disable/logout, default 30 min, per-event save, Calendar deep link and 320px layout.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
