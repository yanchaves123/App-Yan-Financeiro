import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { getTodayDateString } from '../src/lib/formatters';
import { addMonths, dateInMonth } from '../src/lib/finance';
import type { Account, RecurringTransaction, Transaction } from '../src/types';

// Run the real storage engine with in-memory browser storage and a recording cloud adapter.
// No Firebase account, network request or production data is used by these tests.
const result = await build({
  stdin: { contents: `export { StorageService } from './storage'; export { events, remoteRows, cloud } from './firestoreSync'; export { auth } from './firebase';`, resolveDir: `${process.cwd()}/src/lib`, loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'isolated-cloud', setup(build) {
    build.onResolve({filter:/^(\.\/firebase|\.\/firestoreSync|firebase\/firestore)$/}, args => ({path:args.path,namespace:'fake-cloud'}));
    build.onLoad({filter:/.*/,namespace:'fake-cloud'}, args => ({contents:args.path.endsWith('firestoreSync') ? `
      export const events=[]; export const remoteRows=new Map(); export const cloud={failFetch:false};
      export const SYNC_COLLECTIONS={ACCOUNTS:'accounts',CATEGORIES:'categories',CREDIT_CARDS:'creditCards',CLIENTS:'clients',PROJECTS:'projects',TRANSACTIONS:'transactions',RECURRING:'recurring',GOALS:'goals',NOTIFICATIONS:'notifications',SETTINGS:'settings',USERS:'users'};
      export const firestoreSaveDoc=async(c,d)=>{events.push({kind:'save',c,d})};
      export const firestoreDeleteDoc=async(c,id)=>{events.push({kind:'delete',c,id})};
      export const firestoreBulkSaveDocs=async(c,items)=>{events.push({kind:'bulkSave',c,items});remoteRows.set(c,[...new Map([...(remoteRows.get(c)||[]),...items].map(x=>[x.id,x])).values()])};
      export const firestoreBulkDeleteDocs=async(c,ids)=>{events.push({kind:'bulkDelete',c,ids})};
      export const firestoreSubscribeCollection=()=>()=>{}; export const firestoreFetchAll=async(c,u)=>{if(cloud.failFetch)throw new Error('offline');return (remoteRows.get(c)||[]).filter(x=>x.userId===u)};
    ` : args.path==='./firebase' ? `export const auth={currentUser:null};export const db={};` : `export const doc=()=>({});export const getDoc=async()=>({exists:()=>false});export const setDoc=async()=>{};`, loader:'js'}));
  }}],
});
const {StorageService: store, events, remoteRows, cloud, auth} = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const mem = new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>mem.get(k)??null,setItem:(k:string,v:string)=>mem.set(k,v),removeItem:(k:string)=>mem.delete(k)}});
const today=getTodayDateString();
const accounts: Account[] = [{id:'a',userId:'u',name:'A',institution:'Test',type:'digital',initialBalance:1000,color:'',createdAt:''},{id:'b',userId:'u',name:'B',institution:'Test',type:'digital',initialBalance:0,color:'',createdAt:''}];
const recurrence: RecurringTransaction={id:'r',userId:'u',description:'Assinatura',type:'expense',amount:89.9,periodicity:'monthly',dueDay:Number(today.slice(8)),startDate:today,active:true,categoryId:'cat',accountId:'a',createdAt:''};
const tx=(extra:Partial<Transaction>={}):Transaction=>({id:'initial',userId:'u',type:'expense',description:'Teste',amount:89.9,date:today,categoryId:'cat',accountId:'a',paymentMethod:'pix',status:'pending',isRecurring:true,recurrenceId:'r',createdAt:'',...extra});
beforeEach(()=>{mem.clear();events.length=0;remoteRows.clear();cloud.failFetch=false;auth.currentUser=null;mem.set('fp_accounts',JSON.stringify(accounts));mem.set('fp_credit_cards',JSON.stringify([{id:'card',userId:'u',name:'Teste',limit:1000,closingDay:10,dueDay:17}]));});
test('saving initial pending transaction before recurrence creates one occurrence per month, never auto-paid',()=>{
  store.saveTransaction(tx());store.saveRecurring(recurrence,true,6);store.syncAllRecurrences('u',6);
  const rows=store.getTransactions('u');assert.equal(rows.length,7);assert.ok(rows.every((t:Transaction)=>t.status==='pending'));
  assert.equal(rows.filter((t:Transaction)=>t.date.startsWith(today.slice(0,7))).length,1);
});
test('recurrence generation does not create a paid duplicate of an explicitly completed first occurrence',()=>{
  store.saveTransaction(tx({status:'completed'}));store.saveRecurring(recurrence,true,6);
  const rows=store.getTransactions('u');assert.equal(rows.length,7);assert.equal(rows.filter((t:Transaction)=>t.status==='completed').length,1);
});
test('pausing, resuming and deleting synchronize forecast changes and preserve paid history',()=>{
  store.saveTransaction(tx({status:'completed'}));store.saveRecurring(recurrence,true,6);
  store.toggleRecurringActive('r');assert.equal(store.getTransactions('u').length,1);assert.equal(store.getRecurring('u')[0].active,false);
  assert.ok(events.some((e:any)=>e.kind==='bulkDelete'&&e.ids.length===6));
  assert.ok(events.some((e:any)=>e.kind==='save'&&e.c==='recurring'&&e.d.active===false));
  store.toggleRecurringActive('r');assert.equal(store.getTransactions('u').length,7);
  store.deleteRecurring('r',true);assert.equal(store.getTransactions('u').length,1);
});
test('recurrence edit updates future amount in local and cloud records',()=>{
  const future=dateInMonth(addMonths(today,1).slice(0,7),31);
  store.saveRecurring({...recurrence,dueDay:31,startDate:future},true,6);
  store.saveRecurring({...recurrence,dueDay:31,startDate:future,amount:120},true,6);
  assert.ok(store.getTransactions('u').every((t:Transaction)=>t.amount===120));
  assert.ok(events.some((e:any)=>e.kind==='bulkSave'&&e.items.some((t:Transaction)=>t.amount===120)));
});
test('invalid transfer is rejected before any local or cloud mutation',()=>{
  assert.throws(()=>store.saveTransaction(tx({type:'transfer',accountId:'',destinationAccountId:'b'})));
  assert.equal(store.getTransactions('u').length,0);assert.equal(events.length,0);
});
test('project initial receipt, later receipt, status reversal and deletion stay reconciled',()=>{
  store.saveProject({id:'p',userId:'u',clientId:'c',name:'Teste',totalValue:1000,receivedValue:0,pendingValue:1000,status:'in_progress',projectDate:today,paymentDeadline:today,createdAt:''});
  store.saveTransaction(tx({type:'income',projectId:'p',status:'completed',amount:200,isRecurring:false,recurrenceId:undefined}));
  assert.equal(store.getProjects('u')[0].receivedValue,200);
  store.saveTransaction(tx({id:'final',type:'income',projectId:'p',status:'completed',amount:800,isRecurring:false,recurrenceId:undefined}));
  assert.equal(store.getProjects('u')[0].pendingValue,0);assert.equal(store.getProjects('u')[0].status,'paid');
  store.saveTransaction({...store.getTransactions('u').find((t:Transaction)=>t.id==='final'),status:'pending'});
  assert.equal(store.getProjects('u')[0].receivedValue,200);assert.equal(store.getProjects('u')[0].pendingValue,800);
  store.deleteTransaction('initial');assert.equal(store.getProjects('u')[0].receivedValue,0);
});
test('project overpayment is rejected without writing a transaction',()=>{
  store.saveProject({id:'p',userId:'u',clientId:'c',name:'Teste',totalValue:100,receivedValue:0,pendingValue:100,status:'in_progress',projectDate:today,paymentDeadline:today,createdAt:''});
  assert.throws(()=>store.saveTransaction(tx({type:'income',status:'completed',projectId:'p',amount:101})));
  assert.equal(store.getTransactions('u').length,0);assert.equal(store.getProjects('u')[0].receivedValue,0);
});


test('financial reset clears local and cloud history while preserving registrations and other users',async()=>{
  const owner='usr_1';
  store.setCurrentUser({id:owner,email:'yanchaves123@gmail.com',name:'Yan',createdAt:''});
  auth.currentUser={emailVerified:true,email:'yanchaves123@gmail.com'};
  mem.set('fp_accounts',JSON.stringify([...accounts,{...accounts[0],id:'owner-account',userId:owner,initialBalance:300}]));
  mem.set('fp_projects',JSON.stringify([{id:'p1',userId:owner,totalValue:100,receivedValue:40,pendingValue:60,status:'in_progress'}]));
  mem.set('fp_goals',JSON.stringify([{id:'g1',userId:owner,currentValue:90,targetValue:1000}]));
  mem.set('fp_transactions',JSON.stringify([tx({id:'owner-tx',userId:owner}),tx({id:'other-tx',userId:'usr_other'})]));
  mem.set('fp_recurring',JSON.stringify([{...recurrence,userId:owner}]));
  mem.set('fp_clients',JSON.stringify([{id:'c1',userId:owner,name:'Preservado'}]));
  remoteRows.set('transactions',[tx({id:'cloud-only',userId:owner})]);
  await store.resetAll();
  assert.equal(store.getTransactions(owner).length,0);
  assert.equal(store.getTransactions('usr_other').length,1);
  assert.equal(store.getRecurring(owner).length,0);
  assert.equal(store.getAccounts(owner)[0].initialBalance,0);
  assert.equal(store.getProjects(owner)[0].totalValue,100);
  assert.equal(store.getProjects(owner)[0].pendingValue,100);
  assert.equal(store.getProjects(owner)[0].receivedValue,0);
  assert.equal(store.getGoals(owner)[0].currentValue,90);
  assert.equal(store.getClients(owner)[0].name,'Preservado');
  assert.ok(events.some((e:any)=>e.kind==='bulkDelete'&&e.c==='transactions'&&e.ids.includes('cloud-only')));
});
test('failed cloud read aborts reset without deleting local data',async()=>{
  store.setCurrentUser({id:'usr_1',email:'yanchaves123@gmail.com',name:'Yan',createdAt:''});
  auth.currentUser={emailVerified:true,email:'yanchaves123@gmail.com'};
  mem.set('fp_transactions',JSON.stringify([tx({userId:'usr_1'})]));
  cloud.failFetch=true;
  await assert.rejects(store.resetAll());
  assert.equal(store.getTransactions('usr_1').length,1);
  assert.equal(events.length,0);
});
test('deleting invoice payment restores purchases and the unpaid limit',()=>{
  const purchase=tx({id:'purchase',paymentMethod:'credit_card',accountId:undefined,creditCardId:'card',invoicePaid:true,invoicePaymentId:'payment',status:'completed'});
  const payment=tx({id:'payment',isCardInvoicePayment:true,status:'completed'});
  store.saveTransactionsBulk([purchase,payment]);
  assert.throws(()=>store.deleteTransaction('purchase'));
  store.deleteTransaction('payment');
  const row=store.getTransactions('u')[0];
  assert.equal(row.invoicePaid,false);assert.equal(row.invoicePaymentId,undefined);
  assert.equal(events.filter((e:any)=>e.kind==='bulkSave').at(-1).items[0].invoicePaid,false);
});
test('accounts and cards with linked movements cannot be deleted',()=>{
  store.saveTransaction(tx({status:'completed'}));
  assert.throws(()=>store.deleteAccount('a'));
  assert.equal(store.getAccounts('u').length,2);
  store.saveTransactionsBulk([tx({id:'card-tx',paymentMethod:'credit_card',creditCardId:'card',accountId:undefined})]);
  assert.throws(()=>store.deleteCreditCard('card'));
});

test('backup restore writes owner data to cloud without restoring sessions or arbitrary storage keys',async()=>{
  const owner='usr_1';
  store.setCurrentUser({id:owner,email:'yanchaves123@gmail.com',name:'Yan',createdAt:''});
  auth.currentUser={emailVerified:true,email:'yanchaves123@gmail.com'};
  const ownAccounts=accounts.map(a=>({...a,userId:owner}));
  await store.restoreBackup({fp_accounts:JSON.stringify(ownAccounts),fp_transactions:JSON.stringify([tx({userId:owner})]),fp_current_user:JSON.stringify({id:'intruso',email:'outro@example.com'}),arbitrary:'nao restaurar'});
  assert.equal(store.getTransactions(owner).length,1);
  assert.equal(store.getCurrentUser().id,owner);
  assert.equal(mem.has('arbitrary'),false);
  assert.ok(events.some((e:any)=>e.kind==='bulkSave'&&e.c==='transactions'));
});
test('backup with foreign owner or invalid financial value is rejected before writes',async()=>{
  store.setCurrentUser({id:'usr_1',email:'yanchaves123@gmail.com',name:'Yan',createdAt:''});
  auth.currentUser={emailVerified:true,email:'yanchaves123@gmail.com'};
  await assert.rejects(store.restoreBackup({fp_transactions:JSON.stringify([tx({userId:'usr_other'})])}));
  mem.set('fp_accounts',JSON.stringify(accounts.map(a=>({...a,userId:'usr_1'}))));
  await assert.rejects(store.restoreBackup({fp_transactions:JSON.stringify([tx({userId:'usr_1',amount:0})])}));
  assert.equal(events.length,0);assert.equal(store.getTransactions('usr_1').length,0);
});

test('new card expense is scheduled once and invoice settlement keeps its month',()=>{
  store.saveTransaction(tx({id:'buy',date:'2026-11-05',creditCardId:'card',paymentMethod:'credit_card'}));
  const row=store.getTransactions('u')[0];
  assert.equal(row.date,'2026-12-17');assert.equal(row.purchaseDate,'2026-11-05');
  store.saveTransaction({...row,description:'Editada'});
  assert.equal(store.getTransactions('u')[0].date,'2026-12-17');
});
test('bulk deletion protects paid purchases and restores a removed settlement',()=>{
  const purchase=tx({id:'purchase',paymentMethod:'credit_card',creditCardId:'card',invoicePaid:true,invoicePaymentId:'payment',status:'completed'});
  const payment=tx({id:'payment',isCardInvoicePayment:true,status:'completed'});
  store.saveTransactionsBulk([purchase,payment]);
  assert.throws(()=>store.deleteTransactionsBulk(['purchase']));
  assert.equal(store.getTransactions('u').length,2);
  store.deleteTransactionsBulk(['payment']);
  assert.equal(store.getTransactions('u')[0].invoicePaid,false);
  assert.equal(store.getTransactions('u')[0].invoicePaymentId,undefined);
});
test('notification read state is synchronized and deterministic IDs do not duplicate',()=>{
  const notification={id:'n',userId:'u',title:'Teste',message:'Teste',type:'info',date:today,read:false};
  store.saveNotification(notification);store.saveNotification({...notification});
  assert.equal(store.getNotifications('u').length,1);
  store.markNotificationRead('n');
  assert.ok(events.some((e:any)=>e.kind==='save'&&e.c==='notifications'&&e.d.read));
  store.markAllNotificationsRead('u');
  assert.ok(events.some((e:any)=>e.kind==='bulkSave'&&e.c==='notifications'&&e.items[0].read));
});
test('credit-card recurring generation is idempotent despite invoice dates in the next month',()=>{
  store.saveRecurring({...recurrence,accountId:undefined,paymentMethod:'credit_card',creditCardId:'card'},true,6);
  const initial=store.getTransactions('u');
  store.syncAllRecurrences('u',6);
  assert.equal(store.getTransactions('u').length,initial.length);
  assert.ok(initial.every((t:Transaction)=>t.purchaseDate&&t.date>t.purchaseDate));
  store.toggleRecurringActive('r');
  assert.equal(store.getTransactions('u').length,0);
});
