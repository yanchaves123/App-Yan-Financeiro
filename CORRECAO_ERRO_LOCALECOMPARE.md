# Correção da tela azul — localeCompare

Erro observado: `Cannot read properties of undefined (reading 'localeCompare')`.

## Causa provável
Uma transação antiga ou importada pode não conter `date` ou `createdAt`. A renderização do Dashboard, das transações ou recorrências utilizava diretamente `campo.localeCompare`, causando falha de inicialização.

## Mudanças
- Comparação segura com fallback apenas para classificação visual, sem modificar os dados originais.
- Proteção de verificações de mês para datas ausentes.
- Nenhum registro é apagado ou migrado automaticamente por esse ajuste.
- Não modifica configurações, permissões nem regras do Firebase.

## Procedimento
1. Faça cópia do projeto atual e de quaisquer dados acessíveis antes de alterar a publicação.
2. Importe/substitua os arquivos deste ZIP no mesmo projeto AI Studio.
3. Teste a pré-visualização, Dashboard e telas de Transações e Recorrências.
4. Só publique após confirmar o funcionamento.

**Observação:** esta alteração visa ao erro específico exibido na captura de tela. Não comprova a sincronização do Firestore, autenticação ou publicação sem testes no ambiente real.
