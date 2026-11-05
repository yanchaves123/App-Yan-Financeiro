# Correção de atualização das datas

O calendário agora acompanha o dia local do aparelho. O app verifica a virada da meia-noite e confere novamente a data ao voltar para a aba ou reabrir o app instalado.

- Novos lançamentos, transferências, compras no cartão, recebimentos, projetos e recorrências iniciam com a data atual ao abrir o formulário.
- Enquanto um formulário novo estiver aberto, sua data padrão acompanha a virada do dia. Uma data escolhida manualmente permanece como escolhida.
- O mês de referência acompanha a virada do mês e do ano quando estiver no mês atual. A consulta manual a meses anteriores continua disponível e é preservada.
- A edição mantém a data do registro existente.

## Aplicar no app existente

Atualize o código do mesmo projeto com o conteúdo deste ZIP e publique novamente no ambiente onde ele já está hospedado. Mantenha a configuração atual do Firebase e o mesmo banco. Depois, recarregue o app para receber a versão nova.

Não é necessário importar dados nem usar as funções de limpeza, restauração ou redefinição. Nenhum acesso ao banco de produção foi realizado nesta correção; arquivos de armazenamento, sincronização e configuração do Firebase foram mantidos sem alterações.

## Validação

Testes automatizados simulam setembro para outubro, virada da meia-noite, retorno de segundo plano, virada do ano, reabertura dos formulários, escolha manual e edição de lançamento antigo. A suíte também valida os cálculos financeiros e operações de armazenamento com serviços simulados, sem utilizar o banco real.

A data segue o relógio e o fuso horário configurados no aparelho.
