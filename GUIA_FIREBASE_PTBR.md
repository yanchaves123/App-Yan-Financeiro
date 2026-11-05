# Yan Financeiro — integração Firebase (versão revisada)

## Antes de substituir a versão publicada
1. Faça backup das informações existentes em **cada dispositivo** (use Exportar no app atual), pois a versão anterior gravava dados no armazenamento do navegador e tinha sincronização com risco de sobrescrita.
2. No console do Firebase, abra o projeto `formidable-informatics-5wh4c` e confira o banco Firestore **nomeado** `ai-studio-yanfinanceiro-5e59d929-09de-4e5e-b751-a5c027dcb5bb`. A configuração no código usa esse banco, **não** necessariamente `(default)`.
3. Em Authentication > Sign-in method, habilite **E-mail/senha**. Em Settings > Authorized domains, valide o domínio usado para publicar o app.
4. Em Cloud Firestore > Rules, **selecione o banco nomeado correto** e publique as regras contidas em `firestore.rules`. Regras locais não são publicadas automaticamente quando você importa o ZIP. Não mantenha regras públicas (`allow read, write: if true`).
5. Crie sua conta no novo formulário; confirme o link recebido no e-mail e depois faça login. A senha anterior do app não era validada e **não foi migrada** ao Firebase.
6. Faça o primeiro acesso no dispositivo que contém os dados locais que deseja migrar. Espere a conexão e confira as coleções no Firestore. **Não faça testes simultâneos em vários dispositivos antes de validar a migração.**
7. Só depois confira em outro dispositivo. Ao cadastrar um lançamento, ele deve aparecer nos demais sem atualizar o navegador.

## Atenção sobre dados pré-existentes no Firestore
Se houver um documento `users/usr_1` herdado do app antigo, ele pode não ter `firebaseUid`. A versão revisada bloqueia a apropriação automática desse perfil: será necessária migração administrativa supervisionada. Não apague coleções nem altere a propriedade do usuário sem backup.

## Limitações e pendências
- O ZIP contém código revisado, **não** uma implantação no seu Firebase.
- Não foi possível executar build, testes de regras no emulador ou testes reais de múltiplos dispositivos neste ambiente, pois as dependências npm não estavam disponíveis.
- A migração automática só acontece quando a coleção remota do usuário estiver vazia; isso evita sobrescrever a nuvem, mas exige conferência e importação manual dos registros locais ausentes quando já existem dados remotos.
- A atualização das configurações e notificações foi ligada ao mesmo banco, mas é importante validar todos os fluxos financeiros, inclusive recorrências, cartões, exclusões, importação e exportação, antes de uso em produção.
- Durante indisponibilidade do Firestore, a interface ainda pode armazenar edições no navegador, mas **não** há fila offline durável garantida para enviá-las posteriormente. Confira se a sincronização concluiu antes de fechar a página.
