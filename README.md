# AUTÔNOMO NO CONTROLE

Seu trabalho dá dinheiro. Agora saiba quanto realmente sobra.

Plataforma de organização financeira para barbeiros, cabeleireiros, manicures, profissionais da beleza, autônomos e MEIs: atendimentos, despesas, reservas, retiradas, simulador “Quanto posso retirar?” e relatórios com exportação CSV.

**Preço: R$ 37,00 — pagamento único, sem mensalidade.** Checkout oficial da Cakto: https://pay.cakto.com.br/9s9wjh3_1358656

## O que tem neste repositório
- `index.html` — o site completo em um único arquivo: página de vendas + área do cliente funcional (atendimentos, despesas, reservas, retiradas, simulador e relatórios/CSV). É este arquivo que a Vercel publica como site.
- `api/webhooks/cakto.ts` — função serverless do webhook da Cakto (liberação automática de acesso).
- `supabase-schema.sql` — tabelas do banco externo (Supabase/Postgres).
- `vercel.json` — configuração da Vercel.
- `.env.example` — modelo das variáveis de ambiente (sem nenhum valor secreto).
- `README-DEPLOY.md` — guia passo a passo de publicação e automação (GitHub → Supabase → Vercel → webhook da Cakto → compra de teste).

## Como publicar
Siga o `README-DEPLOY.md`. Resumo: importe este repositório na Vercel, rode o SQL no Supabase, cadastre as variáveis do `.env.example` na Vercel, aponte o webhook da Cakto para a URL pública e faça uma compra de teste antes de divulgar.

O sistema é uma ferramenta de organização financeira: não substitui contabilidade profissional nem garante resultados financeiros.
