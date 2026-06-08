/**
 * Auditoria de Lojas — Score de Higiene e Adoção do CRM (regras do comitê comercial).
 * Opera sobre o filteredData (aba DEALS) sem mutá-lo. Cada loja inicia com 100 pontos.
 */

import { isStagnantLead } from "@/lib/metrics";

/** Penalidades por ocorrência. */
export const SCORE_PENALTY = {
  estagnado: 10, // open em fase ativa, sem atualização há >48h
  tiBh: 15, // saiu da pré-qualificação mas segue com PROPRIETÁRIO "TI BH"/"TIBH"
  ganhoZerado: 20, // STATUS ganho com QUANTIA zerada/nula
  perdaSemMotivo: 15, // STATUS perdido sem MOTIVO DE PERDA
  semDocumento: 5, // Triagem/Análise/Faturamento sem CPF ou E-mail
};

/** Fases que exigem CPF/E-mail preenchidos (rule 5). */
const DOC_STAGES = ["triagem", "analise", "faturamento"];
/** Fragmentos da pré-qualificação / IA (rule 2). */
const PREQUAL_STAGES = ["pre-qualificacao", "sdr", "prospeccao"];

/** Normaliza removendo acentos + lowercase + trim. */
function normTxt(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

const isOpen = (status) => ["aberto", "open", "aberta"].includes(normTxt(status));
const isGanho = (status) => normTxt(status) === "ganho";
const isPerdido = (status) => normTxt(status) === "perdido";

/** true se o estágio contém algum fragmento da lista (sem acento). */
function stageHas(estagio, list) {
  const e = normTxt(estagio);
  if (!e) return false;
  return list.some((k) => e.includes(k));
}

/** true se o proprietário é "TI BH"/"TIBH" (ignorando espaços/acentos/caixa). */
function isTiBh(proprietario) {
  return normTxt(proprietario).replace(/\s/g, "") === "tibh";
}

/**
 * Agrupa por Loja (PIPELINE) e calcula o Score de Higiene (0–100) por
 * Conformidade Proporcional (média ponderada por 4 pilares percentuais).
 *
 * @param {Array<Record<string, any>>} filteredData
 * @param {Record<string, number>} [penalties] (mantido por compatibilidade; não usado no novo modelo)
 * @returns {Array<{
 *   loja: string,
 *   totalLeads: number,
 *   estagnados: number,
 *   tiBh: number,
 *   ganhosZerados: number,
 *   perdasSemMotivo: number,
 *   semDocumento: number,
 *   score: number,
 * }>}
 */
export function computeStoreHygiene(filteredData) {
  const now = Date.now();
  const map = new Map();

  for (const row of filteredData) {
    const loja = String(row.pipeline ?? "").trim() || "Sem Loja";
    const entry =
      map.get(loja) || {
        loja,
        totalLeads: 0,
        estagnados: 0,
        tiBh: 0,
        ganhosZerados: 0,
        perdasSemMotivo: 0,
        semDocumento: 0,
      };

    // Total de Leads Recebidos (base do Score): TODOS os cards da loja
    // (abertos + ganhos + perdidos), independentemente do estágio/status.
    entry.totalLeads += 1;

    // Infrações (contagens que alimentam tabela, slides e relatório).
    if (isStagnantLead(row, now)) entry.estagnados += 1;

    if (isTiBh(row.proprietario) && !stageHas(row.estagio, PREQUAL_STAGES)) {
      entry.tiBh += 1;
    }

    if (isGanho(row.status) && !(Number(row.quantia) > 0)) {
      entry.ganhosZerados += 1;
    }

    if (isPerdido(row.status) && String(row.motivoPerda ?? "").trim() === "") {
      entry.perdasSemMotivo += 1;
    }

    if (stageHas(row.estagio, DOC_STAGES)) {
      const cpfEmpty = String(row.cpf ?? "").trim() === "";
      const emailEmpty = String(row.email ?? "").trim() === "";
      if (cpfEmpty || emailEmpty) entry.semDocumento += 1;
    }

    map.set(loja, entry);
  }

  return Array.from(map.values())
    .map((entry) => {
      // Média Ponderada de Confiança (Bayesiana): a nota real da loja é puxada
      // para 50 quando há poucos leads e "solta" conforme o volume cresce.
      const estagnados = entry.estagnados;
      const total = entry.totalLeads; // movimentados + estagnados
      const movimentados = total - estagnados;

      let score = 50; // cenário zero leads -> neutro
      if (total > 0) {
        const K = 5; // peso de estabilização (5 leads virtuais com nota 50)
        const taxaSucesso = (movimentados / total) * 100;
        const forcaNeutra = K * 50; // 250
        const forcaLoja = total * taxaSucesso; // = movimentados * 100
        score = Math.round((forcaNeutra + forcaLoja) / (K + total));
      }
      return { ...entry, score };
    })
    .sort((a, b) => a.score - b.score); // pior score primeiro (foco em problemas)
}

/** Classifica o estágio de um card em uma coluna do funil (ou null). */
function classifyStage(estagio) {
  const e = normTxt(estagio);
  if (!e) return null;
  if (e.includes("pre-qualificacao") || e.includes("prospeccao")) return "preQualif";
  if (e.includes("novos leads") || e.includes("em atendimento")) return "novosLeads";
  if (e.includes("triagem")) return "triagem";
  if (e.includes("analise") || e.includes("credito")) return "analise";
  if (e.includes("faturamento") || e.includes("integracao fiscal")) return "faturamento";
  return null;
}

/**
 * Matriz analítica por loja (aba Relatórios): funil de cards ABERTOS por estágio
 * + flags de higiene + Score (reaproveita computeStoreHygiene, sem divergir).
 * Ordenada do menor Score para o maior.
 *
 * @param {Array<Record<string, any>>} filteredData
 * @param {Record<string, number>} [penalties]
 * @returns {Array<Object>}
 */
export function computeStoreReport(filteredData, penalties = SCORE_PENALTY) {
  const now = Date.now();
  const hygiene = computeStoreHygiene(filteredData, penalties); // já ordenado por score asc

  // Funil de cards abertos por estágio + estagnados na Pré-Qualificação (>48h).
  const stageMap = new Map();
  const emptyStages = () => ({
    preQualif: 0,
    novosLeads: 0,
    triagem: 0,
    analise: 0,
    faturamento: 0,
    estagnadosPreQ: 0,
  });

  for (const row of filteredData) {
    if (!isOpen(row.status)) continue;
    const stage = classifyStage(row.estagio);
    if (!stage) continue;

    const loja = String(row.pipeline ?? "").trim() || "Sem Loja";
    const entry = stageMap.get(loja) || emptyStages();
    entry[stage] += 1;

    // Estagnados: regra única (1ª fase + 48h, DATA ATUALIZAÇÃO ou CRIAÇÃO).
    if (stage === "preQualif" && isStagnantLead(row, now)) {
      entry.estagnadosPreQ += 1;
    }

    stageMap.set(loja, entry);
  }

  return hygiene.map((h) => ({ ...h, ...(stageMap.get(h.loja) || emptyStages()) }));
}
