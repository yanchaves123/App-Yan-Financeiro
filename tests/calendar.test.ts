import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { useDefaultDate, useReferenceMonth } from '../src/hooks/useCalendar';
import { getTodayDateString, getCurrentMonthYear } from '../src/lib/formatters';
import { TransactionModal } from '../src/components/modals/TransactionModal';
import { ProjectModal } from '../src/components/modals/ProjectModal';
import { RecurringModal } from '../src/components/modals/RecurringModal';
import { TransferModal } from '../src/components/modals/TransferModal';
import { CreditCardPurchaseModal } from '../src/components/modals/CreditCardPurchaseModal';
import { ProjectPaymentModal } from '../src/components/modals/ProjectPaymentModal';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

test('local calendar: midnight, suspended PWA, month/year rollover and manual dates', t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: new Date(2026, 8, 30, 23, 59, 59).getTime() });
  const win = new EventTarget();
  const doc = new EventTarget();
  Object.defineProperty(globalThis, 'window', {value: win, configurable: true});
  Object.defineProperty(globalThis, 'document', {value: doc, configurable: true});
  let result: any;
  function Probe({open = true, editing = false}) {
    const [date, setDate] = useDefaultDate(open, editing);
    const [month, setMonth] = useReferenceMonth();
    result = {date, setDate, month, setMonth};
    return null;
  }
  let renderer: any;
  try {
    act(() => { renderer = create(React.createElement(Probe)); });
    assert.equal(result.date, '2026-09-30');
    act(() => t.mock.timers.tick(1100));
    assert.equal(result.date, '2026-10-01');
    assert.equal(result.month, '2026-10');
    act(() => { result.setDate('2026-09-12'); result.setMonth('2026-08'); });
    act(() => { t.mock.timers.setTime(new Date(2026, 10, 3, 8).getTime()); win.dispatchEvent(new Event('focus')); });
    assert.equal(result.date, '2026-09-12');
    assert.equal(result.month, '2026-08');
    act(() => renderer.update(React.createElement(Probe, {open:false})));
    act(() => renderer.update(React.createElement(Probe, {open:true})));
    assert.equal(result.date, '2026-11-03');
    act(() => result.setMonth('2026-11'));
    act(() => { t.mock.timers.setTime(new Date(2027, 0, 1, 8).getTime()); doc.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(result.date, '2027-01-01');
    assert.equal(result.month, '2027-01');
    act(() => renderer.update(React.createElement(Probe, {editing:true})));
    act(() => result.setDate('2026-09-05'));
    act(() => { t.mock.timers.setTime(new Date(2027, 0, 2, 8).getTime()); win.dispatchEvent(new Event('pageshow')); });
    assert.equal(result.date, '2026-09-05');
  } finally {
    if (renderer) act(() => renderer.unmount());
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  }
});

test('forms mounted in September use October when opened, and November when reopened', t => {
  t.mock.timers.enable({apis:['Date'], now:new Date(2026, 8, 10, 12).getTime()});
  const shared = {isOpen:false, onClose(){}, accounts:[]};
  const project = {id:'p', name:'Teste', pendingValue:10, paymentMethod:'pix'};
  const cases: any[] = [
    [TransactionModal, {...shared, categories:[], creditCards:[], clients:[], projects:[], onSave(){}}],
    [ProjectModal, {...shared, clients:[], onSave(){}}],
    [RecurringModal, {...shared, categories:[], creditCards:[], clients:[], onSave(){}}],
    [TransferModal, {...shared, onSave(){}}],
    [CreditCardPurchaseModal, {...shared, creditCards:[], categories:[], userId:'u', onSaveInstallments(){}}],
    [ProjectPaymentModal, {...shared, project, onConfirmPayment(){}}],
  ];
  const renderers: any[] = [];
  try {
    for (const [component, props] of cases) act(() => {renderers.push(create(React.createElement(component, props)));});
    t.mock.timers.setTime(new Date(2026, 9, 15, 12).getTime());
    cases.forEach(([component, props], i) => {
      act(() => renderers[i].update(React.createElement(component, {...props, isOpen:true})));
      assert.equal(renderers[i].root.findAllByType('input').find((n:any)=>n.props.type==='date').props.value, '2026-10-15');
      act(() => renderers[i].update(React.createElement(component, props)));
    });
    t.mock.timers.setTime(new Date(2026, 10, 1, 12).getTime());
    cases.forEach(([component, props], i) => {
      act(() => renderers[i].update(React.createElement(component, {...props, isOpen:true})));
      assert.equal(renderers[i].root.findAllByType('input').find((n:any)=>n.props.type==='date').props.value, '2026-11-01');
    });
  } finally { for (const renderer of renderers) act(()=>renderer.unmount()); }
});

test('defaults use the local calendar rather than UTC at night in Brazil', t => {
  t.mock.timers.enable({apis:['Date'], now:new Date(2026, 9, 15, 23, 30).getTime()});
  assert.equal(getTodayDateString(), '2026-10-15');
  assert.equal(getCurrentMonthYear(), '2026-10');
});

test('editing a saved September transaction preserves its date and original data', t => {
  t.mock.timers.enable({apis:['Date'], now:new Date(2026, 9, 15, 12).getTime()});
  const saved = Object.freeze({id:'existing',userId:'u',description:'Existente',amount:42,date:'2026-09-05',type:'expense',categoryId:'c',accountId:'a',status:'completed',paymentMethod:'pix',createdAt:'2026-09-05T12:00:00Z'});
  const original = JSON.stringify(saved);
  let renderer:any;
  act(()=>{renderer=create(React.createElement(TransactionModal, {isOpen:true, transactionToEdit:saved, accounts:[], categories:[], creditCards:[],clients:[],projects:[],onClose(){},onSave(){}} as any));});
  assert.equal(renderer.root.findAllByType('input').find((n:any)=>n.props.type==='date').props.value, '2026-09-05');
  assert.equal(JSON.stringify(saved), original);
  act(()=>renderer.unmount());
});
