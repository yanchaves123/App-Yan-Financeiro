import type { Category, Transaction } from '../types';
import { isValidDate } from './finance';
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for(let i=0;i<text.length;i++) {
    const ch=text[i];
    if(ch==='"') { if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted; }
    else if(ch===';'&&!quoted) {row.push(cell);cell='';}
    else if((ch==='\n'||ch==='\r')&&!quoted) {if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}
    else cell+=ch;
  }
  if(quoted)throw new Error('CSV com aspas não fechadas.');
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
const quote=(value: unknown)=>`"${String(value??'').replace(/"/g,'""')}"`;
export function exportTransactionsCSV(txs: Transaction[], categories: Category[]): string {
  const headers=['ID','Data','Tipo','Descricao','Valor','Categoria','Status','FormaPagamento','Dados'];
  return '\ufeff'+[headers.join(';'),...txs.map(t=>[t.id,t.date,t.type==='income'?'Receita':t.type==='expense'?'Despesa':'Transferencia',t.description,t.amount.toFixed(2),categories.find(c=>c.id===t.categoryId)?.name||'',t.status,t.paymentMethod,JSON.stringify(t)].map(quote).join(';'))].join('\n');
}
export function importTransactionsCSV(text: string, categories: Category[], userId: string, accountId: string): Transaction[] {
  const [head,...rows]=parseCSV(text.replace(/^\ufeff/,''));
  if(!head||!rows.length)throw new Error('O CSV não contém lançamentos.');
  const headers=head.map(h=>h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
  const get=(row:string[],key:string)=>row[headers.indexOf(key)]?.trim()||'';
  return rows.map((row,i)=>{
    if(get(row,'dados')) {
      const data=JSON.parse(get(row,'dados'));
      if(!data||typeof data!=='object'||Array.isArray(data)||data.userId!==userId)throw new Error(`Linha ${i+2}: dados de outra conta ou inválidos.`);
      return data as Transaction;
    }
    let date=get(row,'data');if(date.includes('/'))date=date.split('/').reverse().join('-');
    const rawAmount=get(row,'valor');
    const amount=Number(rawAmount.includes(',')?rawAmount.replace(/\./g,'').replace(',','.'):rawAmount);
    const rawType=get(row,'tipo').toLowerCase();
    if(!['receita','income','despesa','expense'].includes(rawType))throw new Error(`Linha ${i+2}: informe Receita ou Despesa. Para transferências e cartões, use o CSV completo exportado pelo app.`);
    const type=rawType==='receita'||rawType==='income'?'income':'expense';
    const category=categories.find(c=>c.name.toLowerCase()===get(row,'categoria').toLowerCase()&&(type==='income'?c.type==='income':c.type!=='income'))||categories.find(c=>type==='income'?c.type==='income':c.type!=='income');
    if(!isValidDate(date)||!Number.isFinite(amount)||amount<=0||!category||!accountId)throw new Error(`Linha ${i+2}: confira data, valor, categoria e conta de destino.`);
    if(get(row,'formapagamento')==='credit_card')throw new Error('Para importar compras no cartão, utilize o CSV completo exportado pelo app ou restaure o backup JSON.');
    return {id:`imp_${crypto.randomUUID()}`,userId,type,description:get(row,'descricao')||'Lançamento importado',amount,date,categoryId:category.id,accountId,paymentMethod:'pix',status:get(row,'status')==='pending'?'pending':'completed',createdAt:new Date().toISOString()};
  });
}
