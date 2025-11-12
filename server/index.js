// ✅ index.js — 給 Vercel 當入口用
import express from "express";
import appHandler from "./server.js";

const app = express();

// 使用 server.js 裡的設定掛載
app.use(appHandler);

// ✅ 讓 Vercel 偵測到 express 並導出 app
export default app;