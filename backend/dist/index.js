"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_routes_1 = __importDefault(require("./routes/api.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express_1.default.json());
// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});
// Healthcheck
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CeramixFlow Backend API',
        timestamp: new Date().toISOString(),
        aiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
        telegramConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim() !== ''),
    });
});
// Mount Routes
app.use('/api', api_routes_1.default);
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏺 CeramixFlow Backend Server running on http://localhost:${PORT}`);
    console.log(`🚀 API Endpoints ready at http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
});
