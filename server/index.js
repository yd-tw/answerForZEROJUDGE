// ✅ index.js — Vercel 專用入口
import app from "./server.js";

// 直接導出現有的 Express app 給 Vercel
export default app;