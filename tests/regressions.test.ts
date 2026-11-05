import test from 'node:test';
import assert from 'node:assert/strict';
import { PendingSync } from '../src/lib/pendingSync';
import { withProjectForecasts } from '../src/lib/projectForecasts';
import { calculateEmergencyReserve, getMonthFinancialSummary } from '../src/lib/calculations';
import { getTodayDateString } from '../src/lib/formatters';
import type { Project, Transaction } from '../src/types';

const today = getTodayDateString();
const project: Project = { id:'p',userId:'u',clientId:'c',name:'Produção',totalValue:100,receivedValue:40,pendingValue:60,status:'in_progress',projectDate:today,paymentDeadline:today,createdAt:'' };
const scheduled: Transaction = { id:'scheduled',userId:'u',projectId:'p',description:'Parcela',type:'income',amount:20,date:today,status:'pending',paymentMethod:'pix',categoryId:'',createdAt:'' };

test('partial project balance appears in receivables and the monthly forecast',()=>{
  const forecasts=withProjectForecasts([], [project]);
  assert.equal(forecasts[0].amount,60);
  assert.equal(getMonthFinancialSummary(forecasts,today.slice(0,7),today).pendingReceivables,60);
});
test('project forecasts do not double scheduled receipts or include cancelled/budget projects',()=>{
  const forecasts=withProjectForecasts([scheduled],[project]);
  assert.equal(forecasts.reduce((sum,t)=>sum+t.amount,0),60);
  assert.equal(withProjectForecasts(forecasts,[project]).length,2);
  assert.equal(withProjectForecasts([], [{...project,status:'cancelled'}]).length,0);
  assert.equal(withProjectForecasts([], [{...project,status:'budget'}]).length,0);
});
test('an older cloud snapshot cannot undo a pending pause or restore pending deletion',()=>{
  const pending=new PendingSync();
  const token=pending.begin('recurring','r',{id:'r',active:false});
  assert.equal(pending.overlay('recurring',[{id:'r',active:true}])[0].active,false);
  pending.begin('transactions','t',null);
  assert.equal(pending.overlay('transactions',[{id:'t'}]).length,0);
  pending.finish('recurring','r',token);
  assert.equal(pending.overlay('recurring',[{id:'r',active:false}])[0].active,false);
});
test('earlier write acknowledgement cannot remove a newer optimistic edit',()=>{
  const pending=new PendingSync();
  const first=pending.begin('recurring','r',{id:'r',active:true});
  pending.begin('recurring','r',{id:'r',active:false});
  pending.finish('recurring','r',first);
  assert.equal(pending.overlay('recurring',[{id:'r',active:true}])[0].active,false);
});
test('empty reserve has no invented expense or target',()=>{
  const reserve=calculateEmergencyReserve([],0,6);
  assert.equal(reserve.monthlyBurnRate,0);assert.equal(reserve.targetReserveAmount,0);
});
