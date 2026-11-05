> Revisão de 05/11/2026: consulte primeiro `RELATORIO_AUDITORIA_2026-11-05.md`. A fonte foi corrigida e validada com 85 testes. As instruções abaixo pertencem à versão anterior; não use opções de reset para aplicar esta revisão.

# Yan Financeiro — revisão de 14/10/2026

## Entrega
No app publicado, foram excluídos 28 lançamentos de todos os períodos. Após recarregar, foram confirmados zero lançamentos e saldo de R$ 0,00 nas cinco contas. Não havia projetos nem recorrências na conferência final. O acumulado de R$ 500,00 da meta existente foi preservado.

O código deste ZIP ainda precisa ser importado e publicado no Google AI Studio. Não contém dados pessoais, backups da conta nem dados dos testes. A limpeza do app foi feita pela interface, sem implantar esta versão.

## Como aplicar
1. Substitua os arquivos do projeto no Google AI Studio, mantendo a configuração do mesmo Firebase.
2. Publique o arquivo firestore.rules no banco Firestore configurado no aplicativo. Ele preserva as regras de propriedade e bloqueia a recriação de registros financeiros anteriores ao marcador de limpeza.
3. Em ambiente local, use npm ci, npm test, npm run lint e npm run build.
4. Publique o app e valide login, receitas/despesas, recorrências e pagamento parcial de projeto.
5. A opção Configurações → Zerar lançamentos e saldos executa a limpeza no navegador e na nuvem, com conexão e confirmação na interface. Não executa automaticamente ao abrir o app.

## Correções
- Parcelamento em centavos e ajuste da parcela residual.
- Fatura sem duplicar despesas; conta de pagamento explícita e confirmação da baixa.
- Exclusão da baixa de fatura reabre as compras vinculadas e recompõe o limite utilizado.
- Saldo de projeto aparece nas previsões, descontando parcelas já agendadas para evitar duplicidade; recebimento abre o formulário do projeto.
- Proteção de edições e exclusões ainda em envio contra snapshots antigos.
- Recorrências respeitam datas, intervalos e fim de mês; previsões não são pagas automaticamente.
- Limpeza de lançamentos, transferências, parcelas, recorrências e avisos financeiros, zerando saldos iniciais e histórico de recebimentos dos projetos.
- Limpeza preserva contas, cartões, clientes, categorias, valores contratados dos projetos e metas. Um projeto preservado pode continuar apresentando seu saldo contratual a receber.
- Marcador na nuvem impede reimportar caches antigos após limpeza pela nova versão.
- Restauração de backup valida dados e mescla com a conta na nuvem; não restaura sessões nem chaves arbitrárias e rejeita registros de outro usuário.
- Bloqueio de exclusão de contas/cartões com vínculos e identificação explícita de dados de demonstração.
- Validação de tipos, contas, transferências e valores; previsões não podem virar transações reais pelo formulário comum.
- Média da reserva em seis meses, sem despesas fictícias para contas vazias.
- Tradução de status da busca, mensagens revisadas e atividades recentes sem lançamentos futuros.

## Validação e limites
35 testes passaram. TypeScript sem erros. Build de produção concluído; há apenas aviso de tamanho do bundle.

Os testes usam um adaptador isolado de nuvem, sem acessar dados reais. A nova versão não foi implantada nem validada com Firebase real nesta revisão. Regras, autenticação, concorrência entre dispositivos, restauração em produção e notificações no iPhone precisam de validação após publicação.

A restauração mescla dados, sem apagar registros ausentes no backup. Limpezas/restaurações grandes usam vários lotes e podem exigir nova tentativa após falha de rede. A leitura inicial da nuvem precisa funcionar antes da limpeza.

Arquivos de diagnóstico anteriores foram mantidos como histórico. Este documento descreve a entrega atual.
