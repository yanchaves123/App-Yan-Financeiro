# Auditoria e correções — Yan Financeiro

Data: 05/11/2026. Fonte: ZIP enviado e inspeção do aplicativo publicado em https://yan-financeiro.ai.studio.

## Resultado e alcance

A versão corrigida passou em **85 testes automatizados**, na checagem TypeScript (`npm run lint`) e na geração de produção (`npm run build`). A suíte original tinha 39 testes, também aprovados antes das alterações.

Foram inspecionadas as 14 seções internas do aplicativo publicado após a sessão autenticada ficar disponível. A tela de autenticação também foi observada inicialmente. Foram conferidos os estados exibidos, as cinco abas de relatórios, a busca de lançamentos, os formulários de despesa e compra parcelada e a central de alertas. Não foram enviados lançamentos fictícios, executadas exclusões, feitos pagamentos, restaurados backups nem acionado o reset na conta real. Os testes de alteração e exclusão usaram armazenamento em memória e um adaptador de nuvem simulado.

A versão publicada continua sendo a anterior: este trabalho entrega o código corrigido, sem implantação no Google AI Studio. Portanto, os testes automatizados validam a fonte entregue; a navegação no domínio valida a versão que estava publicada durante a inspeção.

## Erros corrigidos

| Área | Problema encontrado | Correção |
| --- | --- | --- |
| Cartões — datas exibidas | A tela mostrava “Fatura Atual (Setembro)”, “Próxima Fatura (Outubro)” e vencimentos fixos de 2026, mesmo com novembro selecionado. Confirmado na navegação e no código. | Mês, ano e vencimentos são calculados pelo mês de referência; testes conferem novembro/dezembro e virada de ano. |
| Compras no cartão | Lançamentos comuns e parcelamentos usavam a data informada diretamente, sem destinar a compra ao mês seguinte. | Regra central no armazenamento para novas despesas no cartão, incluindo parcelas e recorrências. A data original é guardada em `purchaseDate` e a data financeira passa ao vencimento do mês seguinte. |
| Edição de compra | Reaplicar uma regra de mudança de mês ao editar ou quitar poderia deslocar a fatura repetidamente. | Compras já programadas mantêm seu mês nas edições usuais e na quitação. Lançamentos históricos não são migrados automaticamente. |
| Cadastro de cartão | O formulário abria com fechamento padrão no dia 5. | Padrão de novos cartões alterado para dia 10. Cartões existentes e presets específicos mantêm seus cadastros. |
| Exclusão em lote | Não havia a proteção da exclusão individual contra remoção de compra já quitada. | Bloqueio até estornar o pagamento; remover o pagamento em lote também reabre as compras vinculadas. |
| Integridade da fatura | Era possível alterar o valor do registro de pagamento sem reconciliar as compras quitadas. | Edições desse valor exigem excluir o registro de pagamento antes de corrigi-lo; proteção também aplicada a compras quitadas em lote. |
| Recorrências no cartão | Mudar a data para o mês da fatura poderia produzir ocorrências duplicadas. | Identificação pela ocorrência original e pelo ID determinístico, além de testes de geração repetida e pausa. |
| Notificações lidas | Marcar um aviso como lido alterava apenas a cópia local. | Sincronização do aviso individual e da marcação coletiva. |
| Notificações duplicadas | O mesmo ID era acrescentado novamente; verificações simultâneas podiam disparar o mesmo horário duas vezes. | Atualização por ID e reserva do horário antes de aguardar o envio. |
| Entrega de notificação | A espera por `serviceWorker.ready` podia ficar indefinida sem um worker registrado. | Consulta à inscrição existente com alternativa de notificação direta, worker para exibição e clique e manifesto instalável. |
| Promessa de lembrete | Interface prometia alertas com app fechado/tela bloqueada sem infraestrutura de envio remoto. | Textos corrigidos; diferenciação entre aviso salvo no app e notificação efetivamente enviada ao sistema. |
| Preferências de lembretes | Registro de horário disparado não era sincronizado; horários do banner eram fixos. | Persistência do disparo e exibição dos horários configurados. |
| CSV | O exportador iniciava com ID/Data/Tipo, mas o importador interpretava as primeiras posições como Data/Descrição/Valor. Separadores e aspas dentro de textos eram lidos incorretamente. Faltava conta de destino. | Leitura por cabeçalho, suporte a aspas/quebras de linha, conta selecionável e mensagens de erro. O CSV completo preserva IDs e vínculos por uma coluna de metadados. |
| Importação histórica | A regra de novas compras não deve deslocar datas de um arquivo histórico reimportado. | Importação preserva as datas financeiras do arquivo e valida os lançamentos antes de gravar. IDs repetidos no lote não criam linhas duplicadas. |
| Assistente de lançamentos | Nomes ausentes podiam vincular o primeiro cliente/projeto; “cartão de débito” era reconhecido como crédito; `10.50` podia virar `1050`. | Correspondência sem nomes vazios, prioridade do débito e tratamento de valores com ponto ou vírgula. Categoria de fallback respeita receita/despesa. |
| Formulário com IA | Não havia seleção do cartão e o modal fechava mesmo com falha ao salvar. | Seletor de cartão e manutenção do formulário aberto em caso de falha. |
| Reabertura de formulários | Forma de pagamento e periodicidade podiam ficar da operação anterior; compra parcelada mantinha campos anteriores. | Reinicialização dos campos ao iniciar nova operação, sem apagar preenchimento durante atualizações de dados. |
| Confirmações e erros | Falhas de exclusão podiam escapar sem mensagem no modal; pagamento de fatura usava botão “Excluir”. | Exibição do erro e texto apropriado para registrar pagamento. |
| Acesso e acessibilidade | Login trazia um e-mail pessoal fixo; documento estava marcado como inglês e bloqueava zoom. | E-mail inicial vazio, idioma pt-BR e zoom permitido. |

## Regra do cartão adotada

Foi seguida a instrução expressa de que **toda nova compra no cartão deve entrar no mês seguinte**, independentemente de ter ocorrido antes, no dia ou depois do fechamento. Exemplo para o cartão que fecha dia 10 e vence dia 17:

| Compra | Data financeira da primeira parcela |
| --- | --- |
| 05/11/2026 | 17/12/2026 |
| 10/11/2026 | 17/12/2026 |
| 11/11/2026 | 17/12/2026 |
| 31/12/2026 | 17/01/2027 |

O fechamento e o vencimento são campos distintos. O vencimento cadastrado define o dia da data financeira. Esta é a regra personalizada solicitada; não há mudança automática para a fatura do próprio mês em compras anteriores ao fechamento. Parcelas seguintes avançam mês a mês; fevereiro e anos bissextos são tratados. Compras futuras deixam de ser consideradas atrasadas pela data da compra; uma pendência pode continuar sendo considerada atrasada depois do vencimento real.

Não foram alteradas datas, valores ou cadastros antigos na conta publicada. A correção não reescreve o histórico automaticamente, pois nem todo lançamento antigo permite distinguir com segurança a data da compra e a data da fatura.

## Conferência por seção

“Renderização” abaixo significa teste do componente React com dados fictícios vazios e preenchidos; não equivale a testar todos os cliques ou dispositivos.

| Seção | Conferência no site publicado | Verificação adicional na fonte corrigida |
| --- | --- | --- |
| Autenticação | Tela de login observada; sessão autenticada posteriormente disponível. | Renderização vazia/preenchida. Cadastro, recuperação e envio de e-mail não executados. |
| Início | Resumo, saldos, evolução, vencimentos e últimos lançamentos inspecionados. | Renderização e cálculos financeiros, previsões de projetos e datas. |
| Lançamentos | Lista, busca e formulário de nova despesa inspecionados. | Formulários, validação, gravação, edição, exclusão individual/em lote, proteção de fatura e reconciliação com projetos. |
| Contas a pagar | Indicadores, abas e estado vazio inspecionados. | Renderização, pendências, vencimentos e saldo. |
| Contas a receber | Indicadores, abas e recebimentos exibidos inspecionados. | Renderização e previsão do saldo de projetos sem duplicar recebimentos. |
| Minhas contas | Contas, saldos e ações disponíveis inspecionados. | Renderização, transferências entre contas, conservação do saldo e bloqueio de exclusão com vínculos. |
| Cartões | Faturas e formulário de compra parcelada inspecionados; datas fixas confirmadas. | Datas dinâmicas, regra do mês seguinte, parcelas em centavos, limites, baixa e estorno. |
| Projetos | Cards, indicadores e filtros disponíveis inspecionados. | Renderização, recebimentos parciais/finais, rejeição de recebimento excessivo e reconciliação após exclusão. |
| Clientes | Lista e indicadores inspecionados. | Renderização com dados vazios/preenchidos e correção de associação indevida no assistente. |
| Relatórios | Abas Mensal, Profissional, Por Categoria, Por Cliente e Evolução Histórica abertas. | Renderização, DRE, evolução e CSV com exportação/reimportação. Impressão física não executada. |
| Metas | Indicadores e estado vazio inspecionados. | Renderização com e sem metas. Depósito e persistência entre dispositivos não executados na conta real. |
| Reserva | Cálculos apresentados e opções de meses inspecionados. | Renderização e teste de histórico vazio sem inventar despesa. |
| Recorrências | Indicadores, abas e ações disponíveis inspecionados. | Periodicidade mensal/semanal/anual, pausa, retomada, edição, exclusão de previsões e idempotência. |
| Categorias | Listagem, modalidades e ações disponíveis inspecionadas. | Renderização vazia/preenchida. Não foram excluídas categorias reais. |
| Configurações | Perfil, lembretes, permissões, backup e ação de reset inspecionados. A permissão de notificações estava bloqueada neste navegador. | Testes de leitura de notificações, agendamento, fallback sem worker, restauração validada e reset isolado que preserva cadastros e outros usuários. |
| Central de alertas | Modal e estado sem alertas inspecionados. | Testes de deduplicação e sincronização da leitura. |

## Resultados reproduzíveis

- `npm ci --ignore-scripts`: dependências instaladas a partir do lockfile.
- `npm test`: 85 testes, 85 aprovados, 0 falhas.
- `npm run lint`: aprovado, sem erros TypeScript.
- `npm run build`: aprovado. Há aviso de tamanho do pacote JavaScript; não é falha de compilação.
- Servidor em modo de produção: `/api/health` retornou 200; parser sem texto retornou 400; parser sem chave Gemini retornou 503 com `fallback: true`, conforme esperado neste ambiente.

Os testes novos estão em `tests/audit.test.ts`, `tests/csv.test.ts`, `tests/notifications.test.ts`, `tests/nlp.test.ts` e nas ampliações de `tests/storage.test.ts`. Os testes existentes de calendário e formulários foram preservados.

## Pendências reais e limites

1. **Publicação:** importar a fonte corrigida no projeto do Google AI Studio e publicar uma nova versão. Não basta atualizar arquivos locais para mudar o endereço público.
2. **Push com app fechado:** precisa de inscrição push, backend e agendamento remoto. O worker incluído permite exibir notificações em plataformas compatíveis, mas não executa uma agenda com o app encerrado.
3. **iPhone/Android:** permissão, som, vibração, instalação e comportamento do sistema precisam de validação física depois da publicação. Nesta execução foram usadas simulações das APIs de notificação, não um celular real.
4. **Nuvem:** alterações, exclusões e reconciliações foram validadas com adaptador simulado. Queda de conexão, regras Firestore implantadas, simultaneidade entre dispositivos e permissões reais de gravação não foram certificados. A arquitetura existente ainda usa gravações otimistas e operações separadas entre coleções; sucesso local não substitui a confirmação de sincronização.
5. **IA remota:** não havia chave Gemini configurada neste ambiente de teste. O endpoint sem chave e o analisador local foram testados; o modelo remoto e sua disponibilidade não foram validados.
6. **Proteção do endpoint de IA:** a fonte recebida expõe `/api/parse-transaction` sem autenticação no servidor. Antes de disponibilizar uma chave Gemini em um serviço público, aplicar autenticação verificada e limites de uso. Essa infraestrutura não foi adicionada nesta revisão.
7. **Histórico antigo:** não houve migração de compras antigas para novas faturas. Revisar registros antigos específicos somente com dados que permitam confirmar a data correta.
8. **Exclusões na conta real e reset:** não executados. O teste de exclusão real não foi concluído; a confirmação visual não foi acionada porque não havia mais linhas listadas no momento dessa etapa. A cobertura da exclusão desta entrega é automatizada e isolada.

Não se conclui “ausência total de erros” apenas pela aprovação da suíte. Este relatório registra as correções verificadas e os cenários que ainda precisam de validação integrada após a publicação.
