/**
 * Isolamento de dados da aba CAMPANHAS (tráfego pago) por unidade/cidade.
 *
 * REGRA ABSOLUTA DE SEGURANÇA: a aba Campanhas não tem coluna de pipeline. A
 * unidade/cidade vem dentro do `Adset Name` entre colchetes, ex.:
 *   "[01] - [PONTA GROSSA] [ABERTO] [20 - 50]".
 * A pipeline da unidade logada é "Velot <Cidade>" (ex.: "Velot Ponta Grossa").
 * Casamos o nome da cidade (minúsculo, sem acento) dentro do Adset Name para
 * garantir que uma unidade JAMAIS veja campanhas de outra.
 */

/** minúsculas + remove acentos + trim (comparação blindada). */
function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * Extrai a cidade da pipeline da unidade.
 * "Velot Ponta Grossa" -> "ponta grossa"
 *
 * @param {string} pipeline
 * @returns {string}  cidade normalizada (minúscula, sem acento), ou "".
 */
export function cityFromPipeline(pipeline) {
  return norm(String(pipeline ?? "").replace(/^\s*velot\s*/i, ""));
}

/**
 * BARREIRA: true se o Adset Name pertence à cidade da pipeline informada.
 * Comparação por substring normalizada (sem acento/caixa), conforme a regra.
 *
 * @param {string} adsetName  Valor do campo Adset Name da campanha.
 * @param {string} pipeline   Pipeline da unidade (ex.: "Velot Ponta Grossa").
 * @returns {boolean}
 */
export function campaignMatchesPipeline(adsetName, pipeline) {
  const city = cityFromPipeline(pipeline);
  if (!city) return false;
  return norm(adsetName).includes(city);
}
