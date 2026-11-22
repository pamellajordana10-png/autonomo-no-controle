// ============================================================
// AUTONOMO NO CONTROLE - Webhook da Cakto (Vercel)
// Arquivo do repositorio: api/webhooks/cakto.ts
//
// Recebe os eventos da Cakto no formato oficial
// ({ secret, event, data: { id, customer.email, status, amount } }),
// valida o secret, registra o evento sem duplicar a mesma compra e
// libera ou bloqueia o acesso do comprador no banco externo.
//
// Variaveis de ambiente (Vercel > Settings > Environment Variables):
//   CAKTO_WEBHOOK_SECRET        o mesmo secret do painel da Cakto
//   SUPABASE_URL                URL do projeto Supabase
//   SUPABASE_SERVICE_ROLE_KEY   chave service_role (so no servidor!)
//   PRICE_CENTS                 preco em centavos (padrao 3700)
// ============================================================

interface CaktoCustomer { name?: string; email?: string; docNumber?: string }
interface CaktoProduct { name?: string; supportEmail?: string }
interface CaktoData {
  id?: string; refId?: string; customer?: CaktoCustomer; product?: CaktoProduct;
  checkoutUrl?: string; status?: string; amount?: number; offer?: { price?: number };
}
interface CaktoPayload { secret?: string; event?: string; data?: CaktoData }

function secretOk(provided: string, expected: string): boolean {
  if (!provided || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const secret = process.env.CAKTO_WEBHOOK_SECRET || "";
  if (!secret) { res.status(500).json({ error: "webhook_secret_not_configured" }); return; }
  let body: CaktoPayload = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch { res.status(400).json({ error: "invalid_json" }); return; }
  if (!secretOk(String(body.secret || ""), secret)) { res.status(401).json({ error: "invalid_secret" }); return; }

  const data: CaktoData = body.data || {};
  const eventName = String(body.event || "").toLowerCase();
  const dataStatus = String(data.status || "").toLowerCase();
  const raw = eventName + " " + dataStatus;
  let mapped = "pendente";
  if (raw.indexOf("chargeback") >= 0 || raw.indexOf("chargedback") >= 0) mapped = "chargeback";
  else if (raw.indexOf("refund") >= 0 || raw.indexOf("reembols") >= 0 || raw.indexOf("estorn") >= 0) mapped = "reembolsado";
  else if (eventName === "purchase_approved" || raw.indexOf("approved") >= 0 || raw.indexOf("aprovad") >= 0 || dataStatus === "paid" || raw.indexOf("payment_confirmed") >= 0) mapped = "aprovado";
  else if (raw.indexOf("refus") >= 0 || raw.indexOf("recus") >= 0 || raw.indexOf("declin") >= 0 || raw.indexOf("cancel") >= 0) mapped = "recusado";

  const externalId = String(data.id || data.refId || "");
  const email = String((data.customer && data.customer.email) || "").trim().toLowerCase();
  if (externalId.length < 3 || email.indexOf("@") < 0) { res.status(422).json({ error: "missing_id_or_email" }); return; }

  // Trava de exemplo/teste da Cakto: payload de demonstracao nunca
  // libera acesso nem entra como venda.
  const domain = email.split("@")[1] || "";
  const productName = String((data.product && data.product.name) || "").toLowerCase();
  const supportEmail = String((data.product && data.product.supportEmail) || "").toLowerCase();
  const checkoutUrlLc = String(data.checkoutUrl || "").toLowerCase();
  const isTest =
    domain === "example.com" || domain === "example.org" || domain === "example.net" || email.indexOf("@example.") >= 0 ||
    checkoutUrlLc.indexOf("/example") >= 0 ||
    productName.indexOf("teste") >= 0 || productName.indexOf("test") >= 0 ||
    supportEmail.endsWith("@seudominio.com") ||
    String((data.customer && data.customer.docNumber) || "") === "12345678909";
  if (isTest) { res.status(200).json({ ok: true, isTestData: true, mappedStatus: mapped, accessUpdated: false }); return; }

  const priceCents = Number(process.env.PRICE_CENTS || "3700") || 3700;
  const amountCents = data.amount && data.amount > 0 ? Math.round(data.amount * 100)
    : (data.offer && data.offer.price && data.offer.price > 0 ? Math.round(data.offer.price * 100) : priceCents);

  const sbUrl = process.env.SUPABASE_URL || "";
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!sbUrl || !sbKey) { res.status(500).json({ error: "database_not_configured" }); return; }
  const headers: Record<string, string> = { apikey: sbKey, Authorization: "Bearer " + sbKey, "Content-Type": "application/json" };

  // Deduplicacao: a mesma compra (data.id) nunca libera duas vezes.
  const existingResp = await fetch(sbUrl + "/rest/v1/payment_events?external_id=eq." + encodeURIComponent(externalId) + "&select=id", { headers });
  const existing = await existingResp.json().catch(() => []);
  if (Array.isArray(existing) && existing.length > 0) { res.status(200).json({ ok: true, duplicate: true, mappedStatus: mapped, accessUpdated: false }); return; }

  const userResp = await fetch(sbUrl + "/rest/v1/users?email=eq." + encodeURIComponent(email) + "&select=id,access_status", { headers });
  const userRows = await userResp.json().catch(() => []);
  const user = Array.isArray(userRows) && userRows.length > 0 ? userRows[0] : null;

  await fetch(sbUrl + "/rest/v1/payment_events", {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: user ? user.id : null, email: email, gateway: "Cakto", external_id: externalId, status: mapped, amount_cents: amountCents }),
  });

  let accessUpdated = false;
  if (user) {
    const target = mapped === "aprovado" ? "active" : (mapped === "reembolsado" || mapped === "chargeback") ? "blocked" : null;
    if (target && user.access_status !== target) {
      await fetch(sbUrl + "/rest/v1/users?id=eq." + user.id, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ access_status: target }),
      });
      accessUpdated = true;
    }
  }
  res.status(200).json({ ok: true, mappedStatus: mapped, accessUpdated: accessUpdated });
}
