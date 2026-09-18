/**
 * Funil COMERCIAL (aba Funil Diário) — responsabilidade da LOJA, separado do
 * funil de Marketing (V4). Consulta TODOS os leads (banco + à vista + CDCI), por
 * isso NÃO se encadeia com o funil de marketing.
 *
 * Etapas: Consultas totais -> CPF Elegíveis -> Propostas enviadas -> Vendas.
 *
 * A loja de cada linha vem do de-para da aba MENU (Vendedor -> Loja), pois os
 * dados chegam com o nome da revenda (ex.: "EM DUAS RODAS"), não da cidade.
 */

import {
  passesDateFilter,
  cityKeyFromPipeline,
  PIPELINE_ALL,
  PIPELINE_FRONTLINE,
  FRONTLINE_CITIES,
} from "@/lib/filters";

const norm = (v) =>
  String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
/** Remove o prefixo de ID "799xxx - " do Vendedor. */
const stripId = (v) => String(v ?? "").replace(/^\s*\d{4,}\s*-\s*/, "").trim();
/** Chave normalizada do vendedor (sem ID, sem acento). */
const vendKey = (v) => norm(stripId(v)).replace(/\s+/g, " ").trim();
const titleCase = (s) =>
  String(s).split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");

/**
 * Constrói o de-para a partir da aba MENU: vendKey -> { loja, cidade, pipeline }.
 * "Velot Motors | Barra Mansa" -> cidade "barra mansa" -> pipeline "Velot Barra Mansa".
 */
export function buildMenuMap(menu = []) {
  const m = new Map();
  for (const row of menu) {
    const key = vendKey(row.vendedorId);
    if (!key) continue;
    const loja = String(row.loja ?? "").trim();
    const cidade = norm(loja.includes("|") ? loja.split("|").pop() : loja)
      .replace(/^velot\s+/, "")
      .replace(/^motors\s+/, "")
      .trim();
    m.set(key, {
      loja,
      cidade,
      pipeline: cidade ? `Velot ${titleCase(cidade)}` : loja || "Loja a definir",
    });
  }
  return m;
}

/** Loja de um vendedor (via MENU); sem match, cai para o próprio nome. */
function lojaOf(vendedor, menuMap) {
  const hit = menuMap.get(vendKey(vendedor));
  if (hit) return hit;
  const nome = String(vendedor ?? "").trim() || "Sem loja";
  return { loja: nome, cidade: "", pipeline: nome };
}

/** Taxas de conversão de um bloco {consultas, elegiveis, propostas, vendas}. */
function rates(s) {
  return {
    pElegiveis: s.consultas > 0 ? s.elegiveis / s.consultas : 0,
    pPropostas: s.elegiveis > 0 ? s.propostas / s.elegiveis : 0,
    pVendas: s.propostas > 0 ? s.vendas / s.propostas : 0,
    fechamento: s.consultas > 0 ? s.vendas / s.consultas : 0,
  };
}

/** true se a loja (cidade) passa no filtro de pipeline selecionado. */
function passesLoja(cidade, pipeline) {
  if (!pipeline || pipeline === PIPELINE_ALL) return true;
  if (pipeline === PIPELINE_FRONTLINE) return FRONTLINE_CITIES.has(cidade);
  return cidade === cityKeyFromPipeline(pipeline);
}

/** Meta = melhor taxa entre lojas com volume mínimo (evita denominador ínfimo). */
function computeMetas(stores, minConsultas = 20) {
  const elegiveis = stores.filter((s) => s.consultas >= minConsultas);
  const props = stores.filter((s) => s.elegiveis >= 5);
  const vend = stores.filter((s) => s.propostas >= 3);
  const max = (arr, k) => (arr.length ? Math.max(...arr.map((s) => s[k])) : 0);
  return {
    pElegiveis: max(elegiveis, "pElegiveis"),
    pPropostas: max(props, "pPropostas"),
    pVendas: max(vend, "pVendas"),
    fechamento: max(elegiveis, "fechamento"),
  };
}

/**
 * Agrega o funil comercial no período/loja selecionados.
 *
 * @param {Array} funilDiario  linhas normalizadas da aba Funil Diário
 * @param {Map} menuMap        de-para (buildMenuMap)
 * @param {{dateRange, pipeline, customStart, customEnd}} filters
 * @returns {{ funnel, stores, metas }}
 */
export function computeComercial(funilDiario = [], menuMap = new Map(), filters = {}) {
  const { pipeline } = filters;
  const byStore = new Map();
  const tot = { consultas: 0, elegiveis: 0, propostas: 0, vendas: 0 };

  for (const row of funilDiario) {
    if (!passesDateFilter(row.data, filters)) continue;
    const info = lojaOf(row.vendedor, menuMap);
    if (!passesLoja(info.cidade, pipeline)) continue;

    const key = info.pipeline;
    const e =
      byStore.get(key) ||
      { loja: info.pipeline, cidade: info.cidade, consultas: 0, elegiveis: 0, propostas: 0, vendas: 0 };
    e.consultas += row.consultas;
    e.elegiveis += row.elegiveis;
    e.propostas += row.propostas;
    e.vendas += row.vendas;
    byStore.set(key, e);

    tot.consultas += row.consultas;
    tot.elegiveis += row.elegiveis;
    tot.propostas += row.propostas;
    tot.vendas += row.vendas;
  }

  const stores = [...byStore.values()]
    .map((s) => ({ ...s, ...rates(s) }))
    .sort((a, b) => b.consultas - a.consultas);

  return {
    funnel: { ...tot, ...rates(tot) },
    stores,
    metas: computeMetas(stores),
  };
}
