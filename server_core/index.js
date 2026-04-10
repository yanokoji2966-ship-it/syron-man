
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import analyticsRoutes from './routes/analytics.js';
import settingsRoutes from './routes/settings.js';
import webhookRoutes from './routes/webhooks.js';
import aiIntelligenceRoutes from './routes/ai_intelligence.js';
import intelligenceRoutes from './routes/intelligence.js'; // Added import
import reviewRoutes from './routes/reviews.js';
import recommendationRoutes from './routes/recommendations.js';
import lookRoutes from './routes/looks.js';
import paymentRoutes from './routes/payments.js';
import { initNexusIngestor } from './services/nexusIngestor.js';
import { updateProductRecommendations } from './services/recommendationService.js';
import { validateLicense, getLicenseStatus } from './services/licenseService.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// No Vercel, as variáveis de ambiente já são injetadas no process.env automaticamente.
const app = express();
const PORT = process.env.PORT || 3001;
const distPath = path.resolve(__dirname, '../dist');

console.log('📂 Configurando caminho do frontend:', distPath);

// IMPORTANTE para Vercel: Confiar no proxy para pegar o IP real do cliente (usado pelo rate limit)
app.set('trust proxy', 1);

// Rate Limiting (Proteção contra Brute Force / DoS)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 2000, // limite de 2000 requisições por IP (evita bloqueio no Turbo Load)
    message: { error: 'Limite de requisições excedido. Verifique sua conexão.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middlewares de Segurança e Log
app.use(helmet({
    contentSecurityPolicy: false, // Gerenciado via vercel.json para maior precisão
}));
app.use(limiter);
app.use(hpp()); // Proteção contra Parameter Pollution
app.use(cors());
app.use(express.json({ limit: '500kb' })); // Aumentado para 500kb para suportar importações e configs grandes
app.use(morgan('dev'));

// Rotas de Domínio
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/ai', aiIntelligenceRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/looks', lookRoutes);
app.use('/api/payments', paymentRoutes);

// Servindo Frontend (Produção)
app.use(express.static(distPath));

// Rota de Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'SYRON MAN API Online', timestamp: new Date() });
});

// Rota de Diagnóstico (Privada para suporte)
app.get('/api/diagnostics', (req, res) => {
    res.json({
        vercel: !!process.env.VERCEL,
        supabase_configured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        node_version: process.version,
        env_keys_present: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('VITE'))
    });
});

// Rota de Status da Licença (Protegida silenciosamente)
app.get('/api/license/status', (req, res) => {
    res.json(getLicenseStatus());
});

// Catch-all para SPA
// Middleware de Fallback para SPA (Compatível com Express 5)
app.use((req, res) => {
    // Evita loop infinito se o arquivo estático da API não existir
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint de API não encontrado.' });
    }

    // Serve o index.html para todas as outras rotas (SPA)
    res.sendFile('index.html', { root: distPath }, (err) => {
        if (err) {
            console.error('❌ Erro ao servir index.html:', err.message);
            if (!res.headersSent) {
                res.status(404).send('Frontend não encontrado. Por favor, certifique-se de que a pasta /dist existe.');
            }
        }
    });
});

// Para rodar localmente (Desenvolvimento)
if (!process.env.VERCEL) {
    app.listen(PORT, (err) => {
        if (err) {
            console.error('❌ ERRO CRÍTICO AO INICIAR SERVIDOR:', err);
            process.exit(1);
        }
        console.log(`🚀 Camada de Domínio SYRON MAN rodando em http://localhost:${PORT}`);

        // Iniciar Ingestão Automática NEXUS
        initNexusIngestor();

        // Validar Licença do Sistema
        validateLicense();

        // Iniciar Motor de Recomendações (Executa uma vez no início e depois a cada 24h)
        updateProductRecommendations();
        setInterval(updateProductRecommendations, 24 * 60 * 60 * 1000);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Erro: A porta ${PORT} já está em uso!`);
        } else {
            console.error('❌ Erro no servidor:', err);
        }
        process.exit(1);
    });
}

export default app;
