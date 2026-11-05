import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTransactionFromText } from '../src/lib/nlp';
import type { Category } from '../src/types';
const cats:Category[]=[{id:'inc',userId:'u',name:'Trabalho',type:'income',color:'',icon:''},{id:'exp',userId:'u',name:'Alimentação',type:'expense_personal',color:'',icon:''}];
test('fallback distinguishes debit from credit and respects cents in both decimal formats',async()=>{
  globalThis.fetch=async()=>({ok:false}) as Response;
  for(const [amount,expected] of [['10.50',10.50],['10,50',10.50],['1.500',1500],['1.500,50',1500.50]] as const){
    const row=await parseTransactionFromText(`Paguei R$ ${amount} no cartão de débito`,cats,[],[],[]);
    assert.equal(row.amount,expected);assert.equal(row.paymentMethod,'debit_card');assert.equal(row.categoryId,'exp');
  }
});
test('AI without client or project names must not attach the first client or project',async()=>{
  globalThis.fetch=async()=>({ok:true,json:async()=>({success:true,data:{type:'expense',description:'Teste',amount:10,paymentMethod:'pix'}})}) as Response;
  const row=await parseTransactionFromText('Paguei 10',cats,[],[{id:'c',name:'Cliente'}] as any,[{id:'p',name:'Projeto'}] as any);
  assert.equal(row.clientId,undefined);assert.equal(row.projectId,undefined);assert.equal(row.categoryId,'exp');
});
