/**
 * Utilitários de filtragem do dashboard (Etapa 2).
 * Não muta o array original — todas as funções retornam novos arrays/valores.
 */

/**
 * Opções do filtro de data. O `value` é usado no <select>.
 */
export const DATE_RANGE_OPTIONS = [
  { value: "all", label: "Todo o período" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "year", label: "Este Ano" },
];

export const DATE_RANGE_DEFAULT = "all";
export const PIPELINE_ALL = "__ALL_PIPELINES__";
export const SOURCE_ALL = "__ALL_SOURCES__";

/**
 * Converte uma string de data (formato BR ou ISO) para um objeto Date.
 * Suporta: "DD/MM/YYYY", "DD/MM/YYYY HH:MM(:SS)", "DD/MM/YY" e fallback para Date nativo.
 *
 * @param {string} value
 * @returns {Date|null}
 */
export function parseDate(value) {
  if (!value) return null;

  const str = String(value).trim();

  // Formato brasileiro: DD/MM/YYYY [HH:MM[:SS]]
  const br = str.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (br) {
    const day = parseInt(br[1], 10);
    const month = parseInt(br[2], 10) - 1;
    let year = parseInt(br[3], 10);
    if (year < 100) year += 2000;
    const hours = br[4] ? parseInt(br[4], 10) : 0;
    const minutes = br[5] ? parseInt(br[5], 10) : 0;
    const seconds = br[6] ? parseInt(br[6], 10) : 0;
    const d = new Date(year, month, day, hours, minutes, seconds);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Fallback (ISO ou outros formatos reconhecidos pelo JS).
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Início do dia de "hoje" (00:00:00), útil como referência para os ranges.
 * @returns {Date}
 */
function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Verifica se uma data está dentro do range selecionado.
 *
 * @param {Date|null} date
 * @param {string} range  Um dos values de DATE_RANGE_OPTIONS.
 * @returns {boolean}
 */
export function isWithinRange(date, range) {
  if (range === "all") return true;
  if (!date) return false;

  const today = startOfToday();

  switch (range) {
    case "today": {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return date >= today && date < tomorrow;
    }
    case "7d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6); // hoje + 6 dias anteriores = 7 dias
      return date >= from;
    }
    case "30d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return date >= from;
    }
    case "year": {
      return date.getFullYear() === today.getFullYear();
    }
    default:
      return true;
  }
}

/**
 * Extrai valores únicos (não vazios) de uma coluna, ordenados alfabeticamente.
 *
 * @param {Array<Record<string, any>>} data
 * @param {string} key  Chave do objeto (ex.: "pipeline", "utmSource").
 * @returns {string[]}
 */
export function getUniqueValues(data, key) {
  const set = new Set();
  for (const row of data) {
    const val = row?.[key];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      set.add(String(val).trim());
    }
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
}

/**
 * Aplica os filtros combinados sobre os dados, retornando um NOVO array.
 *
 * @param {Array<Record<string, any>>} data
 * @param {{ dateRange: string, pipeline: string, source: string }} filters
 * @returns {Array<Record<string, any>>}
 */
export function applyFilters(data, filters) {
  const { dateRange, pipeline, source } = filters;

  return data.filter((row) => {
    // Filtro de data (coluna DATA CRIAÇÃO -> dataCriacao).
    if (dateRange && dateRange !== "all") {
      const created = parseDate(row.dataCriacao);
      if (!isWithinRange(created, dateRange)) return false;
    }

    // Filtro de Loja/Franquia (coluna PIPELINE).
    if (pipeline && pipeline !== PIPELINE_ALL) {
      if (String(row.pipeline).trim() !== pipeline) return false;
    }

    // Filtro de Origem (coluna CF_UTM_SOURCE -> utmSource).
    if (source && source !== SOURCE_ALL) {
      if (String(row.utmSource).trim() !== source) return false;
    }

    return true;
  });
}
