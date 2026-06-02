import Papa from "papaparse";

/**
 * URLs das 3 abas publicadas (output=csv) da planilha da Velot.
 * Cada aba é exportada por um link individual (Google Sheets exporta 1 aba por link).
 */
export const SOURCE_URLS = {
  // Aba LEADS SDR — entrada bruta de leads (colunas: DATA, TELEFONE, NOME).
  leadsSdr:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfANI6fzYqt3yWoXMkSFVt0E1pfZBeiPKp2m3nQnoEC2HUWrfBu-Vqx4kZxFvjWFN7EmSzFHpn6b6o/pub?gid=917398745&single=true&output=csv",
  // Aba MOVIMENTAÇÃO — deals (mesmo formato de 41 colunas, datas sem hora).
  movimentacao:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfANI6fzYqt3yWoXMkSFVt0E1pfZBeiPKp2m3nQnoEC2HUWrfBu-Vqx4kZxFvjWFN7EmSzFHpn6b6o/pub?gid=0&single=true&output=csv",
  // Aba DEALS — deals consolidados (41 colunas, datas com hora).
  deals:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfANI6fzYqt3yWoXMkSFVt0E1pfZBeiPKp2m3nQnoEC2HUWrfBu-Vqx4kZxFvjWFN7EmSzFHpn6b6o/pub?gid=1920849068&single=true&output=csv",
};

/** Mantido por compatibilidade: a fonte primária do dashboard é a aba DEALS. */
export const CSV_URL = SOURCE_URLS.deals;

/**
 * Mapeamento: cabeçalho da aba DEALS/MOVIMENTAÇÃO -> chave do objeto JSON.
 */
export const COLUMN_MAP = {
  "DATA CRIAÇÃO": "dataCriacao",
  "DATA ATUALIZAÇÃO": "dataAtualizacao",
  PIPELINE: "pipeline",
  "ESTÁGIO": "estagio",
  "DEAL ID": "dealId",
  "NOME DEAL": "nomeDeal",
  STATUS: "status",
  "MOTIVO DE PERDA": "motivoPerda",
  "QUANTIDADE PRODUTOS": "quantidadeProdutos",
  PRODUTOS: "produtos",
  QUANTIA: "quantia",
  "DATA PREVISTA FECHAMENTO": "dataPrevistaFechamento",
  TAGS: "tags",
  "PROPRIETÁRIO": "proprietario",
  "NOME CONTATO": "nomeContato",
  TELEFONE: "telefone",
  EMAIL: "email",
  CPF: "cpf",
  CF_TELEFONE: "cfTelefone",
  CF_CIDADE: "cidade",
  CF_FORMA_DE_PAGAMENTO: "formaPagamento",
  CF_PRODUTO_DEFINIDO: "produtoDefinido",
  CF_UTM_SOURCE: "utmSource",
  CF_UTM_MEDIUM: "utmMedium",
  CF_UTM_CAMPAIGN: "utmCampaign",
  CF_UTM_CONTENT: "utmContent",
  CF_UTM_TERM: "utmTerm",
  CF_LINK_WPP: "linkWpp",
};

/** Mapeamento da aba LEADS SDR. */
export const LEADS_SDR_MAP = {
  DATA: "data",
  TELEFONE: "telefone",
  NOME: "nome",
};

/**
 * Converte um valor monetário (BR ou já numérico) para Number.
 * Ex.: "R$ 1.234,56" -> 1234.56 | 17991 -> 17991 | "" -> 0
 *
 * @param {string|number} value
 * @returns {number}
 */
export function parseQuantia(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  let normalized = String(value)
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  normalized = normalized.replace(/\./g, "").replace(",", ".");

  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Acrescenta um parâmetro de tempo à URL para forçar a quebra de cache.
 * As URLs já contêm "?", então o separador é sempre "&".
 *
 * @param {string} url
 * @returns {string}
 */
export function withCacheBuster(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${new Date().getTime()}`;
}

/**
 * Reindexa uma linha bruta por cabeçalho "trimado", tolerando espaços ocultos.
 * @param {Record<string, any>} row
 * @returns {Record<string, any>}
 */
function trimKeys(row) {
  const trimmed = {};
  for (const key of Object.keys(row)) {
    if (typeof key === "string") trimmed[key.trim()] = row[key];
  }
  return trimmed;
}

/** Normaliza um valor de célula para string aparada. */
function cell(raw) {
  return raw === undefined || raw === null ? "" : String(raw).trim();
}

/** Mapeia uma linha de DEALS/MOVIMENTAÇÃO conforme COLUMN_MAP. */
function mapDealRow(row) {
  const trimmed = trimKeys(row);
  const mapped = {};
  for (const [csvHeader, jsonKey] of Object.entries(COLUMN_MAP)) {
    mapped[jsonKey] = cell(trimmed[csvHeader]);
  }
  // QUANTIA -> número (a partir do valor bruto, antes do .trim()).
  mapped.quantia = parseQuantia(trimmed["QUANTIA"]);
  return mapped;
}

/** Mapeia uma linha da aba LEADS SDR. */
function mapLeadRow(row) {
  const trimmed = trimKeys(row);
  const mapped = {};
  for (const [csvHeader, jsonKey] of Object.entries(LEADS_SDR_MAP)) {
    mapped[jsonKey] = cell(trimmed[csvHeader]);
  }
  return mapped;
}

/**
 * Faz o parse de um CSV remoto com PapaParse e devolve as linhas brutas.
 *
 * @param {string} url
 * @param {string} label  Rótulo para o log de debug.
 * @returns {Promise<Array<Record<string, any>>>}
 */
function parseCsv(url, label) {
  const bustedUrl = withCacheBuster(url);
  return new Promise((resolve, reject) => {
    Papa.parse(bustedUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => (typeof header === "string" ? header.trim() : header),
      complete: (results) => {
        // Debug solicitado: inspecionar o retorno do PapaParse.
        console.log(`Dados recebidos do PapaParse [${label}]:`, results.data);
        resolve(results.data || []);
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Busca a aba DEALS já normalizada.
 * @returns {Promise<Array<Record<string, any>>>}
 */
export function fetchDeals() {
  return parseCsv(SOURCE_URLS.deals, "DEALS").then((rows) =>
    rows.map(mapDealRow).filter((r) => r.dealId !== "" || r.nomeDeal !== "")
  );
}

/**
 * Busca a aba MOVIMENTAÇÃO já normalizada (mesmo formato de DEALS).
 * @returns {Promise<Array<Record<string, any>>>}
 */
export function fetchMovimentacao() {
  return parseCsv(SOURCE_URLS.movimentacao, "MOVIMENTACAO").then((rows) =>
    rows.map(mapDealRow).filter((r) => r.dealId !== "" || r.nomeDeal !== "")
  );
}

/**
 * Busca a aba LEADS SDR já normalizada.
 * @returns {Promise<Array<Record<string, any>>>}
 */
export function fetchLeadsSdr() {
  return parseCsv(SOURCE_URLS.leadsSdr, "LEADS_SDR").then((rows) =>
    rows.map(mapLeadRow).filter((r) => r.telefone !== "" || r.nome !== "")
  );
}

/**
 * Busca as 3 abas em paralelo (Promise.all) e cruza/devolve o estado unificado.
 *
 * @returns {Promise<{
 *   deals: Array<Record<string, any>>,
 *   movimentacao: Array<Record<string, any>>,
 *   leadsSdr: Array<Record<string, any>>,
 * }>}
 */
export function fetchAllSources() {
  return Promise.all([fetchDeals(), fetchMovimentacao(), fetchLeadsSdr()]).then(
    ([deals, movimentacao, leadsSdr]) => ({ deals, movimentacao, leadsSdr })
  );
}

/**
 * Compatibilidade: retorna apenas a aba DEALS (fonte primária do dashboard).
 * @param {string} [url=CSV_URL]
 * @returns {Promise<Array<Record<string, any>>>}
 */
export function fetchData() {
  return fetchDeals();
}
