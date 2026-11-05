import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { TransactionModal } from '../src/components/modals/TransactionModal';
import { TransferModal } from '../src/components/modals/TransferModal';
import { CreditCardPurchaseModal } from '../src/components/modals/CreditCardPurchaseModal';
import { ProjectPaymentModal } from '../src/components/modals/ProjectPaymentModal';
import type { Account, Category } from '../src/types';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const accounts: Account[] = ['a','b'].map(id=>({id,userId:'u',name:id,type:'digital',institution:'Teste',initialBalance:0,color:'',createdAt:''}));
const categories: Category[] = [{id:'cat',userId:'u',name:'Despesa',type:'expense_personal',color:'',icon:''}];
const props={isOpen:true,onClose:()=>{},onSave:()=>{},accounts,categories,creditCards:[],clients:[],projects:[]};

test('realtime array updates do not erase entered date, description or amount',()=>{
  let renderer:any;
  act(()=>{renderer=create(React.createElement(TransactionModal,props));});
  const input=(type:string)=>renderer.root.findAllByType('input').find((x:any)=>x.props.type===type);
  act(()=>{input('date').props.onChange({target:{value:'2026-12-20'}});input('number').props.onChange({target:{value:'123.45'}});renderer.root.findByProps({placeholder:'ex: Adobe Creative Cloud / Mercado'}).props.onChange({target:{value:'Meu teste'}});});
  act(()=>renderer.update(React.createElement(TransactionModal,{...props,accounts:[...accounts],categories:[...categories],creditCards:[]})));
  assert.equal(input('date').props.value,'2026-12-20');assert.equal(input('number').props.value,'123.45');assert.equal(renderer.root.findByProps({placeholder:'ex: Adobe Creative Cloud / Mercado'}).props.value,'Meu teste');
  act(()=>renderer.unmount());
});
test('scheduled expense defaults to pending and preserves that status on submit',()=>{
  let renderer:any,saved:any;
  act(()=>{renderer=create(React.createElement(TransactionModal,{...props,defaultStatus:'pending',onSave:(data:any)=>{saved=data;}}));});
  act(()=>{renderer.root.findAllByType('input').find((x:any)=>x.props.type==='number').props.onChange({target:{value:'10'}});renderer.root.findByProps({placeholder:'ex: Adobe Creative Cloud / Mercado'}).props.onChange({target:{value:'Pendente'}});});
  act(()=>renderer.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(saved.status,'pending');act(()=>renderer.unmount());
});
test('transfer form uses the available account IDs and submits both legs',()=>{
  let renderer:any,saved:any;
  act(()=>{renderer=create(React.createElement(TransferModal,{isOpen:true,accounts,onClose:()=>{},onSave:(data:any)=>{saved=data;}}));});
  act(()=>renderer.root.findAllByType('input').find((x:any)=>x.props.type==='number').props.onChange({target:{value:'100'}}));
  act(()=>renderer.root.findByType('form').props.onSubmit({preventDefault(){}}));
  assert.equal(saved.accountId,'a');assert.equal(saved.destinationAccountId,'b');assert.equal(saved.amount,100);act(()=>renderer.unmount());
});
test('purchase and receipt modals can change visibility without changing hook order',()=>{
  for(const [component,extra] of [[CreditCardPurchaseModal,{creditCards:[],categories,onSaveInstallments:()=>{},userId:'u'}],[ProjectPaymentModal,{project:null,accounts,onConfirmPayment:()=>{}}]] as any){
    let renderer:any;
    act(()=>{renderer=create(React.createElement(component,{...extra,isOpen:false,onClose:()=>{}}));});
    assert.doesNotThrow(()=>act(()=>renderer.update(React.createElement(component,{...extra,isOpen:true,onClose:()=>{}}))));act(()=>renderer.unmount());
  }
});
