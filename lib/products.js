/**
 * Agregação de produtos / modelos de moto (aba Produtos — Etapa 7).
 * Opera sobre o filteredData (aba DEALS) sem mutá-lo.
 */

function norm(value) {
  return String(value ?? "").trim().toLowerCase();
}

/** Resolve o nome do modelo a partir das colunas disponíveis. */
function modelName(row) {
  const def = String(row.produtoDefinido ?? "").trim();
  if (def) return def;
  const prod = String(row.produtos ?? "").trim();
  if (prod) return prod.replace(/\s*\(qtd:.*$/i, "").trim();
  return "Sem produto definido";
}

/**
 * Faturamento somado por modelo (apenas deals ganhos) + alerta de infrações
 * (ganhos com QUANTIA zerada/nula).
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {{
 *   byModel: Array<{ model: string, total: number, count: number }>,
 *   infraCount: number,
 *   totalGanho: number,
 * }}
 */
export function computeProductRevenue(filteredData) {
  const map = new Map();
  let infraCount = 0;
  let totalGanho = 0;

  for (const row of filteredData) {
    if (norm(row.status) !== "ganho") continue;

    const quantia = Number(row.quantia) || 0;

    // Infração: venda ganha sem valor (catálogo não usado).
    if (!(quantia > 0)) {
      infraCount += 1;
      continue; // não soma faturamento (é zero), mas conta a infração
    }

    const model = modelName(row);
    const entry = map.get(model) || { model, total: 0, count: 0 };
    entry.total += quantia;
    entry.count += 1;
    totalGanho += quantia;
    map.set(model, entry);
  }

  const byModel = Array.from(map.values()).sort((a, b) => b.total - a.total);

  return { byModel, infraCount, totalGanho };
}
