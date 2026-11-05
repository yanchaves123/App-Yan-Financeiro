# Diagnóstico do erro localeCompare — Yan Financeiro

Esta versão preserva o projeto anterior e mostra uma identificação de versão e a pilha do erro na própria tela.

## Verificação

1. Faça backup do seu projeto e NÃO apague dados do navegador ou do Firebase.
2. No Google AI Studio, substitua o código-fonte do projeto por esta versão (não apenas o link).
3. Abra o Preview. Se aparecer a mensagem de falha, fotografe o texto em **Detalhes técnicos do erro**.
4. Publique a atualização no MESMO aplicativo e abra o link em aba anônima, sem apagar cache/dados do seu navegador principal.
5. Se não aparecer o identificador **YF-2026-10-14-B** na mensagem de erro, a implantação não está usando esta versão.
6. Se aparecer, envie a pilha do erro para localizarmos o componente exato.

As comparações `localeCompare` diretas conhecidas do projeto original foram substituídas por `safeCompare` nesta versão. A existência do erro no link publicado pode indicar build antigo ou execução em outra rota de código. Não é correto afirmar que Firebase causou esse erro sem a pilha.
