import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '2mb' }));

function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'GHOST SHORELINE',
    satelliteConnected: false,
    datasetMode: 'DEMO_REFERENCE',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/satellite/status', (_req: Request, res: Response) => {
  res.json({
    connected: false,
    mode: 'INTERFACE_READY_DEMO',
    notice:
      'Live satellite ingestion backend is not yet connected. Displayed values use curated DEMO reference observations.',
    pipelines: [
      {
        id: 'sentinel-2',
        name: 'Sentinel-2 MSI Level-2A',
        resolutionMeters: 10,
        revisitDays: '5 days (cloud-dependent)',
        status: 'Ready for Connector',
      },
      {
        id: 'sentinel-1',
        name: 'Sentinel-1 GRD SAR',
        resolutionMeters: 10,
        revisitDays: '6-12 days (all-weather)',
        status: 'Ready for Connector',
      },
      {
        id: 'jrc-gsw',
        name: 'JRC Global Surface Water v1.4',
        resolutionMeters: 30,
        revisitDays: 'Monthly / Multi-decadal archive',
        status: 'Ready for Connector',
      },
    ],
  });
});

app.get('/api/methodology', (_req: Request, res: Response) => {
  res.json({
    project: 'GHOST SHORELINE',
    subtitle: "India's Vanishing Lakes & Ponds Monitoring System",
    limitations: [
      'Initial statistics and maps are labeled DEMO DATA and do not represent live satellite measurements.',
      'Historical baselines (e.g., 2016-2018) and recent observations (e.g., 2025) are explicitly separated.',
      'Satellite monitoring is periodic (5 to 12 day revisit intervals), not continuous live video.',
      'Small village ponds (< 1-5 ha) face mixed-pixel uncertainty at 10m-30m medium spatial resolution.',
      'Drought alerts are preliminary hydrological screening indicators, not official government drought declarations.',
    ],
  });
});

app.post('/api/reports/csv', (req: Request, res: Response) => {
  const body = req.body as { rows?: unknown[] };
  if (!body || !Array.isArray(body.rows) || body.rows.length === 0 || body.rows.length > 1000) {
    res.status(400).json({ error: 'Provide between 1 and 1000 report rows.' });
    return;
  }

  const headers = [
    'ID',
    'Name',
    'Alternative Names',
    'Entry Type',
    'Waterbody Category',
    'State',
    'District',
    'Country',
    'Latitude',
    'Longitude',
    'Historical Area (ha)',
    'Recent Area (ha)',
    'Estimated Area Loss (ha)',
    'Monitoring Status',
    'Verification Status',
    'Data Source',
    'Resolution Note',
  ];

  const lines: string[] = [
    sanitizeCsvCell(
      'GHOST SHORELINE REPORT — SAMPLE / DEMO REFERENCE DATA (NOT LIVE SATELLITE TELEMETRY)'
    ),
    headers.map(sanitizeCsvCell).join(','),
  ];

  for (const rawRow of body.rows) {
    if (!rawRow || typeof rawRow !== 'object') continue;
    const row = rawRow as Record<string, unknown>;
    const altNames = Array.isArray(row.alternative_names)
      ? row.alternative_names.join('; ')
      : '';
    const cells = [
      row.id,
      row.name,
      altNames,
      row.entry_type,
      row.waterbody_category,
      row.state,
      row.district,
      row.country,
      row.latitude ?? '',
      row.longitude ?? '',
      row.historical_area ?? '',
      row.recent_area ?? '',
      row.estimated_area_loss ?? '',
      row.monitoring_status,
      row.verification_status,
      row.data_source,
      row.resolutionNote,
    ];
    lines.push(cells.map(sanitizeCsvCell).join(','));
  }

  const csvOutput = lines.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="ghost-shoreline-waterbodies-report.csv"'
  );
  res.send(csvOutput);
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GHOST SHORELINE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
