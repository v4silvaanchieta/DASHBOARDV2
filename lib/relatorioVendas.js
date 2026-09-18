/**
 * Comparativo RELATÓRIO DE VENDAS × CRM (leads V4).
 *
 * Para cada venda do relatório (por data), cruza com o CRM por CPF → Telefone →
 * Nome exato (sem "1º+último" para evitar homônimos). Match = origem V4; sem
 * match = origem desconhecida. Loja via de-para do MENU.
 *
 * O ganho é lançado no CRM (upstream); aqui a aba serve para CONFERIR (checkbox)
 * e, ao confirmar, o dashboard passa a contar o ganho na DATA DO RELATÓRIO.
 */

import { passesDateFilter } from "@/lib/filters";

const norm = (v) =>
  String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const digits = (v) => String(v ?? "").replace(/\D/g, "");
const cpf11 = (v) => {
  let d = digits(v);
  if (d.length > 11) d = d.slice(0, 11);
  return d.length === 11 ? d : "";
};
const phone8 = (v) => {
  const d = digits(v);
  return d.length >= 8 ? d.slice(-8) : "";
};
const STOP = new Set(["de", "da", "do", "dos", "das", "e"]);
const nameFull = (v) =>
  norm(v).split(/\s+/).filter((t) => t.length >= 2 && !STOP.has(t)).join(" ");

/** Chave do negócio no CRM (igual ao excludeKey do page.js). */
export function dealKeyOf(d) {
  const id = String(d?.dealId ?? "").trim();
  if (id) return id;
  return `${String(d?.nomeDeal ?? d?.nomeContato ?? "").trim()}|${String(
    d?.dataCriacao ?? ""
  ).trim()}`;
}

/** Chave estável de uma venda (para o controle de confirmação). */
export function saleKeyOf(sale) {
  const id = cpf11(sale?.cpf) || phone8(sale?.telefone) || nameFull(sale?.nomeCliente);
  return `${id}|${String(sale?.data ?? "").trim()}`;
}

/** Índice do CRM por CPF / telefone / nome exato -> registro do negócio. */
function buildCrmIndex(deals) {
  const byCpf = new Map(), byPhone = new Map(), byFull = new Map();
  const put = (m, k, d) => {
    if (!k || m.has(k)) return;
    m.set(k, d);
  };
  for (const d of deals) {
    put(byCpf, cpf11(d.cpf), d);
    put(byPhone, phone8(d.telefone) || phone8(d.cfTelefone), d);
    put(byFull, nameFull(d.nomeContato) || nameFull(d.nomeDeal), d);
  }
  return { byCpf, byPhone, byFull };
}

/** Loja da venda via de-para do MENU (buildMenuMap de lib/comercial). */
function lojaOf(vendedor, menuMap) {
  const stripId = String(vendedor ?? "").replace(/^\s*\d{4,}\s*-\s*/, "").trim();
  const key = norm(stripId).replace(/\s+/g, " ").trim();
  const hit = menuMap.get(key);
  return hit ? hit.pipeline : String(vendedor ?? "").trim() || "Sem loja";
}

/**
 * Monta o comparativo das vendas (filtradas por data) contra o CRM.
 *
 * @param {Array} vendas
 * @param {Array} deals
 * @param {Map} menuMap
 * @param {object} filters            filtros globais (usa a data)
 * @param {object} [confirmedSales]   { saleKey: true }
 * @returns {{ rows: Array, stats: object }}
 */
export function buildComparison(vendas = [], deals = [], menuMap = new Map(), filters = {}, confirmedSales = {}) {
  const idx = buildCrmIndex(deals);
  const rows = [];
  const stats = {
    total: 0, v4: 0, desconhecida: 0, jaGanho: 0, confirmados: 0,
    valorTotal: 0, valorV4: 0, valorDesconhecida: 0, valorJaGanho: 0,
    byCriterio: { CPF: 0, Telefone: 0, "Nome exato": 0 },
  };
  const lojaMap = new Map();

  for (const sale of vendas) {
    if (!passesDateFilter(sale.data, filters)) continue;
    stats.total += 1;

    const c = cpf11(sale.cpf), p = phone8(sale.telefone), f = nameFull(sale.nomeCliente);
    let deal = null, criterio = "";
    if (c && idx.byCpf.has(c)) { deal = idx.byCpf.get(c); criterio = "CPF"; }
    else if (p && idx.byPhone.has(p)) { deal = idx.byPhone.get(p); criterio = "Telefone"; }
    else if (f && idx.byFull.has(f)) { deal = idx.byFull.get(f); criterio = "Nome exato"; }

    const matched = !!deal;
    const won = matched && norm(deal.status) === "ganho";
    const saleKey = saleKeyOf(sale);
    const confirmado = !!confirmedSales[saleKey];
    const valor = Number(sale.valorVenda) || 0;
    const loja = lojaOf(sale.vendedor, menuMap);

    stats.valorTotal += valor;
    if (matched) {
      stats.v4 += 1; stats.valorV4 += valor;
      stats.byCriterio[criterio] = (stats.byCriterio[criterio] || 0) + 1;
    } else {
      stats.desconhecida += 1; stats.valorDesconhecida += valor;
    }
    if (won) { stats.jaGanho += 1; stats.valorJaGanho += valor; }
    if (confirmado) stats.confirmados += 1;

    const le = lojaMap.get(loja) || { loja, n: 0, valor: 0, v4: 0, desc: 0 };
    le.n += 1; le.valor += valor; if (matched) le.v4 += 1; else le.desc += 1;
    lojaMap.set(loja, le);

    rows.push({
      saleKey,
      dealKey: matched ? dealKeyOf(deal) : "",
      data: sale.data, // "YYYY-MM-DD" (data do relatório = data real da Velot)
      loja,
      vendedor: sale.vendedor,
      modelo: sale.modelo,
      valor,
      cliente: sale.nomeCliente,
      cpf: sale.cpf,
      telefone: sale.telefone,
      origem: matched ? "V4" : "Desconhecida",
      criterio: criterio || "—",
      // status do lead no CRM
      statusCrm: matched ? (won ? "Ganho" : "No CRM (aberto)") : "Sem match",
      crmCliente: matched ? deal.nomeContato || deal.nomeDeal || "" : "",
      crmCpf: matched ? deal.cpf || "" : "",
      crmTelefone: matched ? deal.telefone || deal.cfTelefone || "" : "",
      crmPipeline: matched ? deal.pipeline || "" : "",
      won,
      confirmado,
    });
  }

  // mais recentes primeiro; dentro do dia, V4 antes
  rows.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : (b.origem === "V4") - (a.origem === "V4")));
  stats.byLoja = [...lojaMap.values()].sort((a, b) => b.valor - a.valor);
  return { rows, stats };
}
