"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env từ thư mục backend
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const client_1 = require("@prisma/client");
const generative_ai_1 = require("@google/generative-ai");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
async function testAllConnections() {
    console.log('\n=============================================================');
    console.log('  🔍 CERAMIXFLOW - KIỂM TRA TOÀN BỘ KẾT NỐI (HEALTH CHECK)');
    console.log('=============================================================\n');
    let dbOk = false;
    let geminiOk = false;
    let telegramOk = false;
    // ----------------------------------------------------------------
    // 1. KIỂM TRA DATABASE (PostgreSQL / Supabase)
    // ----------------------------------------------------------------
    console.log('📦 [1/3] Đang kiểm tra kết nối Database (Supabase/PostgreSQL)...');
    const prisma = new client_1.PrismaClient();
    try {
        const result = await prisma.$queryRaw `SELECT 1 + 1 AS result`;
        console.log('   ✅ DATABASE: Kết nối THÀNH CÔNG!');
        console.log('   📊 Host:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Local/Embedded');
        dbOk = true;
    }
    catch (err) {
        console.error('   ❌ DATABASE: Kết nối THẤT BẠI!');
        console.error('   ⚠️ Chi tiết lỗi:', err.message);
        console.error('   💡 Gợi ý: Kiểm tra lại mật khẩu hoặc chuỗi kết nối trong .env');
    }
    finally {
        await prisma.$disconnect();
    }
    console.log('\n-------------------------------------------------------------');
    // ----------------------------------------------------------------
    // 2. KIỂM TRA GOOGLE GEMINI AI API
    // ----------------------------------------------------------------
    console.log('🤖 [2/3] Đang kiểm tra Google Gemini AI API...');
    const geminiKey = process.env.GEMINI_API_KEY;
    const configuredModel = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
    if (!geminiKey || geminiKey.trim() === '') {
        console.log('   ⚠️ GEMINI: Chưa điền GEMINI_API_KEY trong .env (Hệ thống sẽ dùng Heuristic Fallback Engine).');
    }
    else {
        const candidateModels = Array.from(new Set([configuredModel, 'gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-pro']));
        const genAI = new generative_ai_1.GoogleGenerativeAI(geminiKey);
        let workingModel = null;
        let lastError = '';
        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = 'Hãy trả về một từ duy nhất: OK';
                const response = await model.generateContent(prompt);
                const reply = response.response.text().trim();
                workingModel = modelName;
                console.log(`   ✅ GEMINI AI: Kết nối THÀNH CÔNG với Model [${modelName}]!`);
                console.log('   💬 Phản hồi từ AI:', reply);
                geminiOk = true;
                break;
            }
            catch (err) {
                lastError = err.message;
            }
        }
        if (!workingModel) {
            console.error(`   ❌ GEMINI AI: Gọi API THẤT BẠI với Model [${configuredModel}]!`);
            console.error('   ⚠️ Chi tiết lỗi:', lastError);
            console.error('   💡 Gợi ý: Kiểm tra lại GEMINI_API_KEY trong file .env (Key chuẩn bắt đầu bằng AIzaSy...) hoặc đổi GEMINI_MODEL');
        }
    }
    console.log('\n-------------------------------------------------------------');
    // ----------------------------------------------------------------
    // 3. KIỂM TRA TELEGRAM BOT
    // ----------------------------------------------------------------
    console.log('📬 [3/3] Đang kiểm tra Telegram Bot & Chat ID...');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || botToken.trim() === '') {
        console.log('   ⚠️ TELEGRAM: Chưa điền TELEGRAM_BOT_TOKEN trong .env (Bản tin sẽ hiển thị trên Live Web Dashboard).');
    }
    else {
        try {
            const bot = new node_telegram_bot_api_1.default(botToken, { polling: false });
            const botInfo = await bot.getMe();
            console.log(`   ✅ TELEGRAM BOT: Token HỢP LỆ! (Tên bot: @${botInfo.username})`);
            if (chatId && chatId.trim() !== '') {
                const testMsg = `🏺 <b>[CeramixFlow] Test kết nối thành công!</b>\n⏰ <i>Thời gian: ${new Date().toLocaleString('vi-VN')}</i>`;
                await bot.sendMessage(chatId, testMsg, { parse_mode: 'HTML' });
                console.log(`   ✅ TELEGRAM MESSAGE: Đã gửi thành công 1 tin nhắn test đến Chat ID: ${chatId}!`);
                telegramOk = true;
            }
            else {
                console.log('   ⚠️ TELEGRAM: Chưa điền TELEGRAM_CHAT_ID để nhận tin nhắn.');
            }
        }
        catch (err) {
            console.error('   ❌ TELEGRAM: Lỗi kết nối Bot!');
            console.error('   ⚠️ Chi tiết lỗi:', err.message);
            console.error('   💡 Gợi ý: Kiểm tra lại Token lấy từ @BotFather');
        }
    }
    console.log('\n=============================================================');
    console.log('  📋 TỔNG KẾT KIỂM TRA:');
    console.log(`  - Database: ${dbOk ? '🟢 HOẠT ĐỘNG' : '🔴 LỖI / CHƯA KẾT NỐI'}`);
    console.log(`  - Gemini AI: ${geminiOk ? '🟢 HOẠT ĐỘNG' : '🟡 CHƯA CẤU HÌNH / HEURISTIC'}`);
    console.log(`  - Telegram: ${telegramOk ? '🟢 HOẠT ĐỘNG' : '🟡 CHƯA CẤU HÌNH / WEB LIVE'}`);
    console.log('=============================================================\n');
}
testAllConnections();
