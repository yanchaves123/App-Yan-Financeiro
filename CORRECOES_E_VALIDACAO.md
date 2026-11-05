# Yan Financeiro — código corrigido

Entrega: 14/10/2026. Alterações no código-fonte; a aplicação publicada não foi atualizada.

## O que mudou

- Datas e mês atual usam o relógio local, substituindo 24/09/2026 nas rotinas operacionais, alertas, resumos, exportação e interpretação por texto. O servidor recebe a data local validada do cliente.
- O formulário de lançamento não apaga os campos quando uma atualização da nuvem renova as listas de contas e categorias.
- Formulários de transferência, parcelamento e recebimento são iniciados com as entidades carregadas. Transferências com origem/destino inválidos ou iguais são bloqueadas.
- Parcelamentos distribuem o resto em centavos: R$ 100,00 em 3x vira R$ 33,33 + R$ 33,33 + R$ 33,34. Datas de meses curtos respeitam o último dia válido.
- A ocorrência inicial é salva antes das previsões da recorrência, preservando o status informado. Nenhuma previsão é paga automaticamente só por estar vencida.
- Recorrências respeitam intervalos mensais, semanais e anuais, início e fim. Pausa, exclusão de previsões e alterações futuras também são encaminhadas à nuvem.
- Contas a pagar e a receber abrem novos lançamentos como pendentes.
- Novos projetos com valor já recebido pedem a conta de recebimento e criam uma receita inicial. Edição, exclusão e mudança de status de receitas vinculadas atualizam o recebido e pendente do projeto. Recebimentos acima do total são rejeitados.
- Baixar uma fatura marca as compras dessa competência como pagas, libera o limite e debita o caixa uma vez. O pagamento da fatura não é somado novamente como despesa na DRE. O resumo usa compras por competência e o saldo usa os movimentos de caixa.
- Textos de armazenamento, notificações e gráfico foram ajustados para refletir os recursos disponíveis.
- Dependências: compatibilidade do esbuild com Vite ajustada; conflito do arquivo de dependências original removido; rode npm install para gerar o novo lockfile.

## Validação executada

24 testes automatizados aprovados: cálculos monetários, milhares de combinações de parcelas, meses curtos e ano bissexto, transferência neutra no patrimônio, validação de contas, datas atuais, atraso, regras de recorrência, geração sem duplicidade, pausa/reativação/exclusão, sincronização simulada, recebimentos e estornos em projetos, baixa de fatura sem duplicação e estabilidade de formulários diante de novas listas da nuvem.

Também aprovados: verificação TypeScript (npm run lint) e compilação de produção (npm run build).

Os testes de persistência usam armazenamento em memória e um adaptador de nuvem simulado, sem acessar a conta real. Não equivalem à validação de concorrência entre dispositivos, regras de segurança do Firebase ou teste completo em Safari/celular. O navegador remoto ficou indisponível durante a sessão anterior; não foi possível repetir o teste no app publicado.

## Como executar e aplicar

1. Faça backup do projeto e dos dados atuais.
2. Extraia o ZIP. Os arquivos do projeto ficam na raiz.
3. Instale Node.js compatível com Vite 8 (Node 22.12+ ou 24) e rode npm install.
4. Rode npm test, npm run lint e npm run build.
5. Para desenvolvimento, rode npm run dev. As configurações Firebase originais estão preservadas; dados reais continuam sujeitos às regras e permissões desse projeto. Para testar sem afetar a conta real, use outro projeto Firebase.
6. Substitua os arquivos correspondentes no projeto do AI Studio ou no repositório usado para publicar. O ZIP contém a versão completa e os testes.
7. Revise a prévia e publique somente depois de validar o ambiente de teste.

## Dados anteriores e limites

Não foi realizada migração automática de dados antigos. Os registros QA criados na avaliação anterior continuam na conta, inclusive possíveis duplicidades e faturas baixadas pelo código anterior. Atualizar o código não corrige retroativamente esses lançamentos. Confira e ajuste os dados com backup antes de usar saldos como reais.

Projetos antigos preservam o recebido histórico existente. O código não inventa conta nem data para recebimentos passados sem lançamento correspondente. Os novos recebimentos movimentam o caixa e atualizam os projetos.

As gravações de projeto e receita continuam usando o mecanismo de sincronização existente; concorrência simultânea entre dispositivos e falhas parciais da nuvem exigem teste de integração adicional. Datas fixas em dados explícitos de demonstração foram preservadas, pois são exemplos históricos, não o relógio operacional.

Não foram testadas integralmente edição/exclusão de compras de uma fatura já baixada, restauração de backup, autenticação, notificações push, voz nem o modelo remoto da IA. Esses itens não devem ser considerados aprovados por esta entrega.
