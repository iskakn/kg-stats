# Kyrgyzstan Statistics Visualizer (World Bank Dataset)

> [!WARNING]
> **AI-GENERATED PROJECT & ZERO GUARANTEE NOTICE**
> 
> **This entire project — including all application code, UI architecture, components, parsers, and visualizations — was created by AI.**
> **There is ZERO GUARANTEE that this project works properly, is error-free, or is fit for any analytical, commercial, legal, or governmental use.**
> 
> However, **the statistical data itself is completely untouched, unmanipulated, and raw**, extracted directly from official World Bank open data repositories.

---

## 📊 Data Source & Provenance

The statistical datasets visualized by this application originate from the **World Bank Group — World Development Indicators (WDI)**:

- **Country Overview**: [World Bank — Kyrgyz Republic](https://data.worldbank.org/country/kyrgyz-republic)
- **Direct Official CSV Archive**: [World Bank API — KGZ CSV Download](https://api.worldbank.org/v2/en/country/KGZ?downloadformat=csv)

The zip archive bundled in this repository is the exact, byte-for-byte official distribution from the World Bank.

---

## 🔄 Universal Data Updates

The application is engineered with an **in-memory universal dataset processor**:

1. Download the latest country archive from the World Bank:
   ```sh
   curl -Lo new_data.zip "https://api.worldbank.org/v2/en/country/KGZ?downloadformat=csv"
   ```
2. Replace or drop the zip file into `src/lib/` (e.g. `src/lib/API_KGZ_DS2_en_csv_v2_*.zip` or any `.zip` matching `API_*_csv_*.zip`).
3. Delete the older zip file (if necessary).
4. Restart or rebuild the application.

The server automatically discovers the archive, extracts all data in-memory on startup without disk pollution, and re-indexes all indicators, metadata, and historical records.

---

## 🚀 Key Features

- **In-Memory Streaming Unzip**: Reads and extracts multi-megabyte World Bank archives on server boot using zero disk writes.
- **Curated Essential Indicators**: Highlights core macroeconomic and demographic benchmarks (GDP, Inflation, Population, Life Expectancy, Unemployment, Remittances, Trade, Poverty).
- **Interactive Visualizations**: Built with lightweight, reactive SVG charts featuring dynamic scaling, hover tooltips, and year-by-year inspection.
- **Complete Archive Explorer**: Instant fuzzy search across all 1,500+ World Development Indicators with category filtering.
- **Observation Records & Metadata**: Inspect raw tabular data and official World Bank methodologies and licensing notes for any metric.
- **First-Visit Compliance Modal**: Built-in disclaimer modal informing visitors of the AI generation origin while referencing the raw World Bank data sources.
- **Clean Single Theme**: Clean, functional, professional light palette optimized for data readability without unnecessary theme toggling.

---

## 🛠️ Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/) (Runes reactivity)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [daisyUI v5](https://daisyui.com/)
- **Zip Decompression**: `fflate` (high-performance in-memory deflate/inflate)
- **CSV Parsing**: `papaparse`

---

## 💻 Development & Build

### Prerequisites
- Node.js (>= 20)
- `pnpm` (recommended) or `npm`

### Installation
```sh
pnpm install
```

### Type Checking & Code Verification
```sh
pnpm check
```

### Building for Production
```sh
pnpm build
```

Preview the production build:
```sh
pnpm preview
```

---

## 📄 License & Attribution

- Statistical data is distributed under the [World Bank Open Data Terms of Use](https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets) (Creative Commons Attribution 4.0 International — CC BY 4.0).
- Source Code: Provided AS-IS without warranty of any kind.
