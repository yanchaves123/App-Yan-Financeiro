import test from 'node:test';
import assert from 'node:assert/strict';
import { exportTransactionsCSV, importTransactionsCSV, parseCSV } from '../src/lib/csv';
import type { Category, Transaction } from '../src/types';
const categories: Category[]=[{id:'cat',userId:'u',name:'Compras',type:'expense_personal',icon:'Tag',color:''}];
const tx: Transaction={id:'x',userId:'u',type:'expense',description:'Compra; "especial"\nSegunda linha',date:'2026-12-17',purchaseDate:'2026-11-05',amount:1234.56,paymentMethod:'credit_card',creditCardId:'c',invoicePaid:true,invoicePaymentId:'p',categoryId:'cat',status:'completed',createdAt:''};
test('complete CSV roundtrip retains IDs, quotes, newlines, dates and invoice links',()=>{
  assert.deepEqual(importTransactionsCSV(exportTransactionsCSV([tx],categories),categories,'u','a'),[tx]);
});
test('simple CSV reads headers, localized amounts and explicit destination account',()=>{
  const [row]=importTransactionsCSV('Data;Descrição;Valor;Tipo;Categoria\n05/11/2026;Teste;1.234,56;Despesa;Compras',categories,'u','a');
  assert.equal(row.amount,1234.56);assert.equal(row.date,'2026-11-05');assert.equal(row.accountId,'a');assert.equal(row.type,'expense');
});
test('bad CSV, foreign backups and missing account are rejected',()=>{
  assert.throws(()=>parseCSV('Data;"aspas abertas'));
  assert.throws(()=>importTransactionsCSV(exportTransactionsCSV([tx],categories),categories,'foreign','a'));
  assert.throws(()=>importTransactionsCSV('Data;Descrição;Valor;Tipo;Categoria\n2026-11-05;Teste;1;Despesa;Compras',categories,'u',''));
});
