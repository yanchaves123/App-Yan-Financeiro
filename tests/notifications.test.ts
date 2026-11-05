import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result=await build({stdin:{contents:`export * from './notifications'; export { state } from './storage';`,resolveDir:`${process.cwd()}/src/lib`,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'memory-notifications',setup(build){
  build.onResolve({filter:/^\.\/storage$/},()=>({path:'store',namespace:'fake'}));
  build.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:`export const state={settings:{enabled:true,times:['08:00'],soundEnabled:false,vibrateEnabled:false,lastTriggered:{}},notifications:[]};export const StorageService={getReminderSettings:()=>state.settings,recordReminderTriggered:(time,date)=>{state.settings.lastTriggered[time]=date},saveNotification:n=>state.notifications.push(n)};`,loader:'js'}));
}}]});
const mod=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const RealDate=Date;
Object.defineProperty(globalThis,'Date',{value:class extends RealDate {constructor(...args:any[]){super(args.length?args[0]:new RealDate(2026,10,5,8,0,30).getTime())}},configurable:true});
let shown=0;
class FakeNotification {static permission='granted';onclick:any;constructor(){shown++} close(){} }
Object.defineProperty(globalThis,'Notification',{value:FakeNotification,configurable:true});
Object.defineProperty(globalThis,'window',{value:{Notification:FakeNotification},configurable:true});
Object.defineProperty(globalThis,'navigator',{value:{serviceWorker:{ready:new Promise(()=>{}),getRegistration:async()=>undefined}},configurable:true});
test('system notification does not wait indefinitely for a missing service worker',async()=>{
  assert.equal(await mod.showSystemNotification('Teste'),true);assert.equal(shown,1);
});
test('concurrent reminder checks produce one notification per slot',async()=>{
  const results=await Promise.all([mod.checkAndTriggerScheduledReminders('u'),mod.checkAndTriggerScheduledReminders('u')]);
  assert.equal(results.filter(Boolean).length,1);assert.equal(mod.state.notifications.length,1);
});
test('disabled reminders do not send notifications',async()=>{
  mod.state.settings.enabled=false;
  assert.equal(await mod.checkAndTriggerScheduledReminders('u'),false);
});
