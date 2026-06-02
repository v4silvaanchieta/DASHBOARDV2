# Velot · Dashboard

Dashboard moderno da Velot construído com **Next.js (App Router)**, **Tailwind CSS** e **Recharts**. Deploy na **Vercel**.

## Etapa 1 — Layout base + ingestão de CSV

- Layout com **Sidebar** lateral fixa e **Header** superior.
- Ingestão de dados via **papaparse** a partir do CSV público do Google Sheets (client-side).
- Utilitário [`lib/fetchData.js`](lib/fetchData.js) + custom hook [`hooks/useDashboardData.js`](hooks/useDashboardData.js).
- A página principal exibe um *loading state* e, ao concluir, `Dados carregados: X linhas encontradas`.

## Rodando localmente

> Requer **Node.js 18.18+** instalado.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Estrutura

```
app/
  layout.js        # Layout raiz (Sidebar + slot de conteúdo)
  page.js          # Dashboard (loading + contagem de linhas)
  globals.css      # Tailwind
components/
  Sidebar.js       # Menu lateral (links fakes nesta etapa)
  Header.js        # Cabeçalho
hooks/
  useDashboardData.js  # Hook client-side de fetch
lib/
  fetchData.js     # Fetch + parse do CSV, mapeamento de colunas, parseQuantia
```

## Deploy na Vercel

Basta importar o repositório na Vercel — o framework Next.js é detectado automaticamente. Nenhuma variável de ambiente é necessária nesta etapa.
