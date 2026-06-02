import Papa from "papaparse";

/**
 * URL pública (output=csv) da planilha do Google Sheets da Velot.
 */
export const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfANI6fzYqt3yWoXMkSFVt0E1pfZBeiPKp2m3nQnoEC2HUWrfBu-Vqx4kZxFvjWFN7EmSzFHpn6b6o/pub?output=csv";

/**
 * Mapeamento: cabeçalho original do CSV -> chave do objeto JSON.
 * Mantenha este objeto como fonte única de verdade para os nomes das colunas.
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
  CF_CIDADE: "cidade",
  CF_FORMA_DE_PAGAMENTO: "formaPagamento",
  CF_PRODUTO_DEFINIDO: "produtoDefinido",
  CF_UTM_SOURCE: "utmSource",
  CF_UTM_MEDIUM: "utmMedium",
  CF_UTM_CAMPAIGN: "utmCampaign",
  CF_UTM_CONTENT: "utmContent",
  CF_UTM_TERM: "utmTerm",
  TELEFONE: "telefone",
};

/**
 * Converte um valor monetário em formato brasileiro para Number.
 * Ex.: "R$ 1.234,56" -> 1234.56 | "" -> 0 | "R$2.000" -> 2000
 *
 * @param {string|number} value
 * @returns {number}
 */
export function parseQuantia(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;

  // Remove "R$", espaços e qualquer caractere que não seja dígito, vírgula, ponto ou sinal.
  let normalized = String(value)
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  // Formato BR: ponto = separador de milhar, vírgula = separador decimal.
  // Removemos os pontos de milhar e trocamos a vírgula decimal por ponto.
  normalized = normalized.replace(/\./g, "").replace(",", ".");

  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Normaliza uma linha bruta do CSV para o objeto JSON com as chaves definidas em COLUMN_MAP.
 *
 * @param {Record<string, string>} row
 * @returns {Record<string, any>}
 */
function mapRow(row) {
  const mapped = {};

  for (const [csvHeader, key] of Object.entries(COLUMN_MAP)) {
    const raw = row[csvHeader];
    mapped[key] = raw === undefined || raw === null ? "" : String(raw).trim();
  }

  // Tratamento numérico do campo QUANTIA.
  mapped.quantia = parseQuantia(row["QUANTIA"]);

  return mapped;
}

/**
 * Acrescenta um parâmetro de tempo à URL para forçar a quebra de cache
 * (navegador + Google Sheets), garantindo dados sempre atualizados.
 *
 * @param {string} url
 * @returns {string}
 */
export function withCacheBuster(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${new Date().getTime()}`;
}

/**
 * Busca o CSV público no client-side e retorna um array de objetos já normalizados.
 * A cada chamada a URL recebe um cache-buster para refletir o estado atual da planilha.
 *
 * @param {string} [url=CSV_URL]
 * @returns {Promise<Array<Record<string, any>>>}
 */
export function fetchData(url = CSV_URL) {
  const bustedUrl = withCacheBuster(url);
  return new Promise((resolve, reject) => {
    Papa.parse(bustedUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = (results.data || [])
            .map(mapRow)
            // Descarta linhas totalmente vazias (sem DEAL ID e sem NOME DEAL).
            .filter((r) => r.dealId !== "" || r.nomeDeal !== "");
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}
