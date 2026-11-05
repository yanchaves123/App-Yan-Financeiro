import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class VisibleErrorBoundary extends React.Component<{children: React.ReactNode}, {error: string | null}> {
  state = {error: null as string | null, stack: null as string | null};
  static getDerivedStateFromError(error: Error) { return {error: error.message || String(error), stack: error.stack || null}; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('Yan Financeiro render error:', error, info); }
  render() {
    if (this.state.error) return <div style={{minHeight:'100vh',background:'#0f172a',color:'#fff',padding:'32px',fontFamily:'system-ui'}}>
      <div style={{fontSize:12,opacity:0.75,marginBottom:12}}>Versão de diagnóstico: YF-2026-10-14-B</div>
      <h1 style={{fontSize:'24px',fontWeight:700}}>Não foi possível iniciar o Yan Financeiro</h1>
      <p>O aplicativo encontrou um erro. Seus dados não foram apagados.</p>
      <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',padding:'16px',background:'#1e293b',borderRadius:'8px'}}>{this.state.error}</pre>
      <details style={{marginTop:12,marginBottom:16}} open><summary>Detalhes técnicos do erro (copie ou fotografe esta parte)</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:12}}>{this.state.stack || "Pilha indisponível"}</pre></details>
      <button onClick={() => location.reload()} style={{padding:'12px 16px',background:'#059669',color:'white',border:0,borderRadius:'8px'}}>Tentar novamente</button>
    </div>;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><VisibleErrorBoundary><App /></VisibleErrorBoundary></StrictMode>
);

// Notification display needs a registration on mobile; no financial data is cached here.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Não foi possível ativar notificações do sistema.', error));
  });
}
