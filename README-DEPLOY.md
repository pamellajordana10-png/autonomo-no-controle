# AUTÔNOMO NO CONTROLE — Guia de publicação e automação

Preço: R$ 37,00 (pagamento único, sem mensalidade)
Checkout da Cakto: https://pay.cakto.com.br/9s9wjh3_1358656
Repositório sugerido: https://github.com/pamellajordana10-png/autonomo-no-controle
URL do webhook: depois do deploy, ela será https://SEU-PROJETO.vercel.app/api/webhooks/cakto

## Arquivos deste kit
- README-DEPLOY.md — este guia.
- api/webhooks/cakto.ts — função da Vercel que recebe o webhook da Cakto, valida o secret, libera o acesso em purchase_approved, revoga em reembolso/chargeback, deduplica por data.id e ignora o payload de exemplo/teste da Cakto.
- supabase-schema.sql — tabelas do banco externo (Supabase/Postgres), espelhando o sistema.
- .env.example — modelo das variáveis de ambiente da Vercel (sem nenhum valor secreto).
- vercel.json — configuração mínima da função do webhook.

## Passo 1 — GitHub
1. Crie o repositório autonomo-no-controle na sua conta do GitHub.
2. Suba o código do projeto junto com os arquivos deste kit, mantendo os caminhos (a função do webhook precisa ficar em api/webhooks/cakto.ts).

## Passo 2 — Banco externo (Supabase)
1. Crie um projeto gratuito em supabase.com.
2. Abra o SQL Editor e rode o arquivo supabase-schema.sql deste kit.
3. Guarde a URL do projeto e a chave service_role (Settings > API) para o passo 3.
Atenção: os dados cadastrados na versão que roda dentro do Muse NÃO migram sozinhos — usuários e registros precisam ser recadastrados ou importados manualmente.

## Passo 3 — Vercel
1. Em vercel.com, Add New Project > importe o repositório do GitHub > Deploy.
2. Em Settings > Environment Variables, cadastre as variáveis do .env.example: CAKTO_WEBHOOK_SECRET (o mesmo secret do painel da Cakto), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CHECKOUT_URL e PRICE_CENTS.
3. Faça um novo deploy após salvar as variáveis e copie a URL pública gerada (ex.: https://autonomo-no-controle.vercel.app).
4. Cole essa URL no campo URL pública do site, nas Configurações comerciais do Admin — ela gera a URL do webhook exibida no painel de Automação.

## Passo 4 — Webhook na Cakto
1. No painel da Cakto, abra o produto e a área de Webhooks/Integrações.
2. Cadastre a URL do webhook: https://SEU-PROJETO.vercel.app/api/webhooks/cakto
3. Ative os eventos de compra aprovada (purchase_approved), reembolso e chargeback.
4. Confira que o secret da Cakto é exatamente o mesmo salvo nas Configurações comerciais do Admin e na variável CAKTO_WEBHOOK_SECRET da Vercel. Sem secret igual nos três lugares, o webhook recusa os eventos (de propósito, por segurança).

## Passo 5 — Compra de teste (obrigatória antes de divulgar)
1. Faça uma compra real de R$ 37,00 pelo checkout da Cakto usando um e-mail seu.
2. Confirme no Admin: o evento aparece como aprovado e o acesso daquele e-mail fica ativo sozinho.
3. Teste também o caminho contrário quando possível: um reembolso deve bloquear o acesso.
Só divulgue o link de vendas depois que esse teste passar de ponta a ponta.

## Enquanto o deploy não estiver no ar
As vendas pelo link da Cakto já funcionam; a liberação é manual: ao receber a confirmação de pagamento na Cakto, ative o acesso do cliente em Admin > Usuários e acesso. A automação completa depende dos passos acima.
