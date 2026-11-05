import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { scheduleCardPurchase, addMonths } from '../src/lib/finance';
import { getMonthFinancialSummary } from '../src/lib/calculations';
import { ToastProvider } from '../src/components/Toast';
import type { Transaction, CreditCard } from '../src/types';
const card: CreditCard = {id:'card',userId:'u',name:'Teste',institution:'Teste',color:'#888888',limit:1000,closingDay:10,dueDay:17,createdAt:''};
const tx: Transaction = {id:'t',userId:'u',description:'Compra',type:'expense',date:'2026-11-05',amount:100,categoryId:'cat',creditCardId:'card',paymentMethod:'credit_card',status:'pending',createdAt:''};
test('all purchases before, on and after closing day enter the following month as requested',()=>{
  for (const day of ['05','10','11','30']) {
    const result=scheduleCardPurchase({...tx,date:`2026-11-${day}`},card);
    assert.equal(result.date,'2026-12-17');assert.equal(result.purchaseDate,`2026-11-${day}`);
    assert.equal(getMonthFinancialSummary([result],'2026-12','2026-11-30').overduePayables,0);
  }
});
test('card scheduling handles year rollover, leap years and short months',()=>{
  assert.equal(scheduleCardPurchase({...tx,date:'2026-12-31'},card).date,'2027-01-17');
  assert.equal(scheduleCardPurchase({...tx,date:'2027-01-31'},{...card,dueDay:31}).date,'2027-02-28');
  assert.equal(scheduleCardPurchase({...tx,date:'2028-01-31'},{...card,dueDay:31}).date,'2028-02-29');
});
test('editing and paying do not shift a scheduled or legacy purchase again',()=>{
  const first=scheduleCardPurchase(tx,card);
  assert.equal(scheduleCardPurchase({...first,description:'Editada'},card,first).date,first.date);
  assert.equal(scheduleCardPurchase({...first,invoicePaid:true,status:'completed'},card,first).date,first.date);
  assert.equal(scheduleCardPurchase({...tx,description:'Histórico'},card,tx).date,tx.date);
  assert.equal(scheduleCardPurchase({...tx,paymentMethod:'pix'},undefined).date,tx.date);
});
test('installments retain invoice due day without losing cents or creating invalid dates',()=>{
  const rows=[0,1,2].map(i=>scheduleCardPurchase({...tx,id:`i${i}`,date:addMonths('2026-12-31',i),amount:[33.33,33.33,33.34][i]},card));
  assert.deepEqual(rows.map(t=>t.date),['2027-01-17','2027-02-17','2027-03-17']);
  assert.equal(rows.reduce((sum,t)=>sum+Math.round(t.amount*100),0),10000);
});

const memory=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v)}});
const names=['Accounts','Cards','Categories','Clients','Dashboard','Goals','Payables','Projects','Receivables','Recurrences','Reports','Reserve','Settings','Transactions','Auth'];
for (const name of names) {
  const Component=(await import(`../src/views/${name}View.tsx`))[`${name}View`];
  for(const populated of [false,true]) test(`${name}: renders ${populated?'populated':'empty'} section without crashing`,()=>{
    const array=(item:any)=>populated?[item]:[];
    const props={currentYearMonth:'2026-11',transactions:array(tx),creditCards:array(card),
      accounts:array({id:'a',userId:'u',name:'Teste',type:'digital',institution:'Teste',initialBalance:1000,color:'#888888',createdAt:''}),
      categories:array({id:'cat',userId:'u',name:'Compras',type:'expense_personal',color:'#888888',icon:'Tag'}),
      clients:array({id:'c',userId:'u',name:'Cliente Teste',createdAt:''}),
      projects:array({id:'p',userId:'u',name:'Projeto Teste',clientId:'c',totalValue:100,receivedValue:0,pendingValue:100,projectDate:'2026-11-05',paymentDeadline:'2026-12-05',status:'in_progress',createdAt:''}),
      recurringList:array({id:'r',userId:'u',type:'expense',description:'Teste',amount:100,periodicity:'monthly',dueDay:10,startDate:'2026-11-05',active:true,createdAt:''}),
      goals:array({id:'g',userId:'u',name:'Meta Teste',targetValue:1000,currentValue:50,deadline:'2027-01-01',createdAt:''}),
      user:{id:'u',name:'Teste',email:'teste@example.com',createdAt:''},isDarkMode:true,hasDemoData:false};
    const html=renderToStaticMarkup(React.createElement(ToastProvider,null,React.createElement(Component,props)));
    assert.ok(html.length>100);assert.ok(html.includes('<h'));
    if(name==='Cards'&&populated){assert.ok(html.includes('Fatura Atual (Novembro de 2026)'));assert.ok(html.includes('17/11/2026'));assert.ok(html.includes('17/12/2026'));assert.ok(!html.includes('Setembro'));}
  });
}
