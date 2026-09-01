import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { NAFDAC_PRODUCTS } from './src/data/nafdacData.ts';
import { evaluateVerification } from './src/utils/scoring.ts';
import { generateDataQualityReport } from './src/utils/dataQuality.ts';
import { runEvaluationBenchmark } from './src/utils/evaluation.ts';
import { parseDrugPackageText } from './src/utils/ocrParser.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini client lazily/safely
  const getGemini = () => {
    if (!process.env.GEMINI_API_KEY) return null;
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API 1: Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', dataset_size: NAFDAC_PRODUCTS.length });
  });

  // API 2: Verify Drug Product
  app.post('/api/verify', (req, res) => {
    try {
      const input = req.body;
      const result = evaluateVerification(input);
      res.json(result);
    } catch (err: any) {
      console.error('Verification error:', err);
      res.status(500).json({ error: 'Failed to process verification', details: err.message });
    }
  });

  // API 3: OCR Drug Packaging Analysis
  app.post('/api/ocr', async (req, res) => {
    try {
      const { imageBase64, rawText } = req.body;
      const ai = getGemini();

      if (ai && (imageBase64 || rawText)) {
        const prompt = `You are an expert pharmaceutical package OCR reader. Extract regulatory and product fields from this drug package.
Return valid JSON only matching this schema:
{
  "product_name": string,
  "nrn": string (e.g. A4-1234 or 04-9087 or B4-6460),
  "active_ingredient": string (e.g. Artemether; Lumefantrine),
  "strength": string (e.g. 80 mg; 480 mg),
  "dosage_form": string (e.g. Tablet, Capsule, Syrup, Injection),
  "manufacturer_name": string,
  "batch_number": string,
  "expiry_date": string (YYYY-MM-DD format if possible)
}
Only extract what is present on the packaging. Do not guess or hallucinate.`;

        let contents: any;
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          contents = {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: 'image/jpeg',
                },
              },
              { text: prompt },
            ],
          };
        } else {
          contents = `${prompt}\n\nPackage Text:\n${rawText}`;
        }

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const extractedText = aiResponse.text?.trim() || '{}';
        const parsed = JSON.parse(extractedText);
        return res.json({ extracted: parsed, method: 'gemini-ocr' });
      }

      // Fallback to local heuristic pattern parser
      const parsed = parseDrugPackageText(rawText || '');
      res.json({ extracted: parsed, method: 'heuristic-regex' });
    } catch (err: any) {
      console.warn('AI OCR Error, falling back to regex:', err);
      const parsed = parseDrugPackageText(req.body.rawText || '');
      res.json({ extracted: parsed, method: 'heuristic-fallback' });
    }
  });

  // API 4: Products Reference & Search
  app.get('/api/products', (req, res) => {
    try {
      const q = (req.query.q as string || '').toLowerCase().trim();
      const statusFilter = (req.query.status as string || '').toLowerCase().trim();
      const formFilter = (req.query.form as string || '').toLowerCase().trim();
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);

      let filtered = NAFDAC_PRODUCTS;
      if (q) {
        filtered = filtered.filter(
          p =>
            p.product_name.toLowerCase().includes(q) ||
            p.nrn.toLowerCase().includes(q) ||
            p.active_ingredient.toLowerCase().includes(q) ||
            p.manufacturer_name.toLowerCase().includes(q)
        );
      }
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status.toLowerCase() === statusFilter);
      }
      if (formFilter && formFilter !== 'all') {
        filtered = filtered.filter(p => p.dosage_form.toLowerCase().includes(formFilter));
      }

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const items = filtered.slice(startIndex, startIndex + limit);

      res.json({
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        products: items,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to query products', details: err.message });
    }
  });

  // API 5: Data Quality Report
  app.get('/api/data-quality', (_req, res) => {
    try {
      const report = generateDataQualityReport();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate data quality report', details: err.message });
    }
  });

  // API 6: Evaluation Benchmark
  app.get('/api/evaluation', (_req, res) => {
    try {
      const benchmark = runEvaluationBenchmark();
      res.json(benchmark);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compute evaluation benchmarks', details: err.message });
    }
  });

  // Vite Middleware integration for development / production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fake Drug Checker Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
