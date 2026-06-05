/**
 * Utilitários de filtragem do dashboard (Etapa 2).
 * Não muta o array original — todas as funções retornam novos arrays/valores.
 */

/**
 * Opções do filtro de data. O `value` é usado no <select>.
 */
export const DATE_RANGE_OPTIONS = [
  { value: "yesterday", label: "Ontem" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "year", label: "Este Ano" },
  { value: "all", label: "Todo o período" },
  { value: "custom", label: "Personalizar período" },
];

/** Filtro padrão: Ontem. */
export const DATE_RANGE_DEFAULT = "yesterday";
export const PIPELINE_ALL = "__ALL_PIPELINES__";
export const SOURCE_ALL = "__ALL_SOURCES__";
/** Origem especial: deals com link de WhatsApp (CF_LINK_WPP) ou tag "V4". */
export const SOURCE_V4 = "__SOURCE_V4__";

/** true se o deal pertence à "Chamada V4": tem link de WhatsApp ou tag V4. */
export function isV4Lead(row) {
  const hasV4Tag = String(row?.tags ?? "")
    .toLowerCase()
    .includes("v4");
  const hasWpp = String(row?.linkWpp ?? "").trim() !== "";
  return hasV4Tag || hasWpp;
}

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
 * Converte uma string "YYYY-MM-DD" (input type=date) para Date local.
 * @param {string} str
 * @param {boolean} endOfDay  Se true, retorna 23:59:59.999 do dia.
 * @returns {Date|null}
 */
function parseInputDate(str, endOfDay = false) {
  const m = String(str ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2] - 1;
  const d = +m[3];
  return endOfDay
    ? new Date(y, mo, d, 23, 59, 59, 999)
    : new Date(y, mo, d, 0, 0, 0, 0);
}

/**
 * Verifica se uma data está dentro do range selecionado.
 *
 * @param {Date|null} date
 * @param {string} range  Um dos values de DATE_RANGE_OPTIONS.
 * @param {{ start?: string, end?: string }} [custom]  Datas (YYYY-MM-DD) para "custom".
 * @returns {boolean}
 */
export function isWithinRange(date, range, custom) {
  if (range === "all") return true;

  // Período personalizado.
  if (range === "custom") {
    const start = parseInputDate(custom?.start, false);
    const end = parseInputDate(custom?.end, true);
    if (!start && !end) return true; // sem limites definidos -> não restringe
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  }

  if (!date) return false;
  const today = startOfToday();

  switch (range) {
    case "today": {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return date >= today && date < tomorrow;
    }
    case "yesterday": {
      const start = new Date(today);
      start.setDate(start.getDate() - 1);
      return date >= start && date < today;
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
 * Predicado de data reutilizável para qualquer aba (ex.: leads de SDR pela coluna DATA).
 *
 * @param {string} rawDate  Valor bruto da data (string).
 * @param {{ dateRange: string, customStart?: string, customEnd?: string }} filters
 * @returns {boolean}
 */
export function passesDateFilter(rawDate, filters) {
  const { dateRange, customStart, customEnd } = filters;
  if (!dateRange || dateRange === "all") return true;
  return isWithinRange(parseDate(rawDate), dateRange, {
    start: customStart,
    end: customEnd,
  });
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
  const { dateRange, pipeline, source, customStart, customEnd } = filters;
  const custom = { start: customStart, end: customEnd };

  return data.filter((row) => {
    // Filtro de data (coluna DATA CRIAÇÃO -> dataCriacao).
    if (dateRange && dateRange !== "all") {
      const created = parseDate(row.dataCriacao);
      if (!isWithinRange(created, dateRange, custom)) return false;
    }

    // Filtro de Loja/Franquia (coluna PIPELINE).
    if (pipeline === PIPELINE_ALL) {
      // "Todas as Lojas" = rede de franquias: SOMENTE pipelines com "velot"
      // (a Matriz e demais pipelines não-franquia ficam isoladas/excluídas).
      if (!String(row.pipeline ?? "").toLowerCase().includes("velot")) return false;
    } else if (pipeline) {
      // Seleção específica (ex.: "Matriz" ou uma franquia) -> match exato.
      if (String(row.pipeline).trim() !== pipeline) return false;
    }

    // Filtro de Origem (coluna CF_UTM_SOURCE -> utmSource, ou "Chamada V4").
    if (source && source !== SOURCE_ALL) {
      if (source === SOURCE_V4) {
        if (!isV4Lead(row)) return false;
      } else if (String(row.utmSource).trim() !== source) {
        return false;
      }
    }

    return true;
  });
}
