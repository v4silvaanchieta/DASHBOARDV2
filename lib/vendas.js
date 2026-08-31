/**
 * Integração do RELATÓRIO DE VENDAS (vendas reais das lojas) com o CRM.
 *
 * Cada venda é cruzada com o CRM (por CPF › telefone › nome completo › "1º+último
 * nome" quando único) para classificar a ORIGEM:
 *   - deu match  -> "v4"           (cliente rastreável no funil V4)
 *   - sem match  -> "desconhecida" (origem não identificada)
 *
 * Depois vira um "ganho sintético" (status = ganho) para somar na QUANTIDADE e no
 * VALOR de Ganhos do dashboard — DEDUPLICANDO contra os ganhos já existentes no
 * CRM (venda que bate com um deal já "ganho" NÃO soma; prioriza o CRM).
 *
 * A loja da venda vem do mapa revenda -> cidade (planilha de unidades + cidade no
 * nome); a cidade é casada com a pipeline real do CRM quando existe.
 */

/** Revenda (nome sem o ID "799xxx - ") -> cidade (minúscula, sem acento). */
export const REVENDA_CITY = {
  "ale motos": "barra mansa",
  "bonet motos joacaba": "joacaba",
  "ckz motors farroupilha": "farroupilha",
  "dl motos paranavai": "paranavai",
  "em duas rodas": "maringa",
  "em duas rodas campo mourao": "campo mourao",
  "hrm motos cascavel pd": "cascavel",
  "hrm motos rolandia": "rolandia",
  "jb motos e cia ltda": "umuarama",
  "kadima motos sapucaia": "sapucaia do sul",
  "md sao j. do rio preto": "sao jose do rio preto",
  "mg motors concordia": "concordia",
  "mg presidente prudente": "presidente prudente",
  "moto facil": "jundiai",
  "mrb motos toledo": "toledo",
  "mult motos araraquara": "araraquara",
  "neto veiculos motors": "sorocaba",
  "pele motos campinas": "indaiatuba",
  "rbm motos ibipora": "ibipora",
  "rbm motos ltda": "londrina",
  "revisa motos": "americana",
  "speed motos apucarana": "apucarana",
  "velot araucaria": "araucaria",
  "velot bauru": "bauru",
  "velot braganca paulista": "braganca paulista",
  "velot campo largo": "campo largo",
  "velot caxias do sul": "caxias do sul",
  "velot criciuma": "criciuma",
  "velot curitiba": "curitiba",
  "velot fazenda rio grande": "fazenda rio grande",
  "velot guarulhos": "guarulhos",
  "velot joinville": "joinville",
  "velot lapa": "lapa",
  "velot marilia": "marilia",
  "velot motors guarulhos": "guarulhos",
  "velot motos ponta grossa": "ponta grossa",
  "velot piracicaba": "piracicaba",
  "velot sao leopoldo": "sao leopoldo",
  "velot telemaco borba": "telemaco borba",
};

const norm = (v) =>
  String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const onlyDigits = (v) => String(v ?? "").replace(/\D/g, "");
/** CPF em 11 dígitos (corta sufixos indevidos); "" se não der 11. */
function cpf11(v) {
  let d = onlyDigits(v);
  if (d.length > 11) d = d.slice(0, 11);
  return d.length === 11 ? d : "";
}
/** Chave de telefone: 8 últimos dígitos (robusto a +55/DDD). */
function phone8(v) {
  const d = onlyDigits(v);
  return d.length >= 8 ? d.slice(-8) : "";
}
const STOP = new Set(["de", "da", "do", "dos", "das", "e"]);
function nameToks(v) {
  return norm(v).split(/\s+/).filter((t) => t.length >= 2 && !STOP.has(t));
}
const nameFull = (v) => nameToks(v).join(" ");
function nameFirstLast(v) {
  const t = nameToks(v);
  return t.length >= 2 ? `${t[0]} ${t[t.length - 1]}` : "";
}
/** Revenda sem o prefixo de ID "799xxx - ". */
const revendaKey = (v) =>
  norm(String(v ?? "").replace(/^\s*\d{4,}\s*-\s*/, "")).replace(/\s+/g, " ").trim();
const titleCase = (s) =>
  String(s).split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");

/** Índice do CRM p/ match: mapas por CPF/telefone/nome, com contagem e "won". */
function buildCrmIndex(deals) {
  const mk = () => new Map();
  const byCpf = mk(), byPhone = mk(), byFull = mk(), byFL = mk();
  const cityPipeline = new Map(); // cidade normalizada -> string exata da pipeline
  const add = (m, k, won) => {
    if (!k) return;
    const e = m.get(k) || { count: 0, won: false };
    e.count += 1;
    if (won) e.won = true;
    m.set(k, e);
  };
  for (const d of deals) {
    const won = norm(d.status) === "ganho";
    add(byCpf, cpf11(d.cpf), won);
    add(byPhone, phone8(d.telefone) || phone8(d.cfTelefone), won);
    const nm = d.nomeContato || d.nomeDeal;
    add(byFull, nameFull(nm), won);
    add(byFL, nameFirstLast(nm), won);
    const p = String(d.pipeline ?? "").trim();
    if (/^velot\s+/i.test(p)) {
      const city = norm(p).replace(/^velot\s+/, "").trim();
      if (city && !cityPipeline.has(city)) cityPipeline.set(city, p);
    }
  }
  return { byCpf, byPhone, byFull, byFL, cityPipeline };
}

/**
 * Cruza uma venda com o índice do CRM. Retorna { matched, won, how }.
 * Ordem: CPF › telefone › nome completo › "1º+último" (só se ÚNICO no CRM).
 */
function matchSale(sale, idx) {
  const c = cpf11(sale.cpf);
  if (c && idx.byCpf.has(c)) return { matched: true, won: idx.byCpf.get(c).won, how: "cpf" };
  const ph = phone8(sale.telefone);
  if (ph && idx.byPhone.has(ph)) return { matched: true, won: idx.byPhone.get(ph).won, how: "telefone" };
  const f = nameFull(sale.nomeCliente);
  if (f && idx.byFull.has(f)) return { matched: true, won: idx.byFull.get(f).won, how: "nome" };
  const fl = nameFirstLast(sale.nomeCliente);
  if (fl && idx.byFL.has(fl) && idx.byFL.get(fl).count === 1)
    return { matched: true, won: idx.byFL.get(fl).won, how: "nome-fl" };
  return { matched: false, won: false, how: "" };
}

/**
 * Pipeline (loja) de uma venda a partir do mapa revenda->cidade. Revenda sem
 * cidade conhecida vira "Velot (loja a definir)" — mantém o prefixo "Velot" para
 * ainda contar em "Todas as Lojas" e sinaliza a pendência.
 */
function pipelineForSale(sale, idx) {
  const city = REVENDA_CITY[revendaKey(sale.vendedor)];
  if (!city) return "Velot (loja a definir)";
  return idx.cityPipeline.get(city) || `Velot ${titleCase(city)}`;
}

/**
 * Constrói os "ganhos sintéticos" a partir do relatório de vendas, cruzando com o
 * CRM e DEDUPLICANDO (venda que bate com deal já "ganho" no CRM é descartada).
 *
 * @param {Array<Record<string, any>>} vendas  Aba Relatório de Vendas normalizada.
 * @param {Array<Record<string, any>>} deals   Aba Deals (CRM) completa.
 * @returns {{ deals: Array<Record<string, any>>, stats: {
 *   total:number, v4:number, desconhecida:number, dedup:number,
 *   valorV4:number, valorDesconhecida:number, how:Record<string,number> } }}
 */
export function buildSalesWonDeals(vendas = [], deals = []) {
  const idx = buildCrmIndex(deals);
  const out = [];
  const stats = { total: 0, v4: 0, desconhecida: 0, dedup: 0, valorV4: 0, valorDesconhecida: 0, how: {} };

  for (const sale of vendas) {
    stats.total += 1;
    const { matched, won, how } = matchSale(sale, idx);
    if (matched && won) {
      // Já contabilizada como Ganho no CRM -> não soma (prioriza o CRM).
      stats.dedup += 1;
      continue;
    }
    const valor = Number(sale.valorVenda) || 0;
    const origem = matched ? "v4" : "desconhecida";
    if (matched) { stats.v4 += 1; stats.valorV4 += valor; stats.how[how] = (stats.how[how] || 0) + 1; }
    else { stats.desconhecida += 1; stats.valorDesconhecida += valor; }

    out.push({
      pipeline: pipelineForSale(sale, idx),
      status: "ganho",
      estagio: "Ganho (Relatório de Vendas)",
      quantia: valor,
      dataCriacao: sale.data,
      dataAtualizacao: sale.data,
      nomeContato: sale.nomeCliente,
      nomeDeal: sale.nomeCliente,
      telefone: sale.telefone,
      cpf: sale.cpf,
      produtos: sale.modelo,
      // Origem: matched -> V4 (tag faz isV4Lead=true); senão marca desconhecida.
      utmSource: "",
      tags: matched ? "V4" : "",
      origem,
      origemDesconhecida: !matched,
      isSaleReport: true,
    });
  }
  return { deals: out, stats };
}

/** Cidade normalizada de uma pipeline "Velot X" -> "x" (para escopo por unidade). */
export function pipelineCityKey(pipeline) {
  return norm(pipeline).replace(/^velot\s+/, "").trim();
}
