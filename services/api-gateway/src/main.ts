import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import { globalRateLimiter } from "services/common/src/middleware/rateLimiter";
// ...
app.use(globalRateLimiter);
app.use("/auth", createProxyMiddleware({ target: "http://auth:4001", changeOrigin: true, pathRewrite: {'^/auth': ''} }));
// ensure strict limiter on sensitive proxied routes done at service level

dotenv.config();
const app = express();
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

// proxy routes to microservices
app.use("/auth", createProxyMiddleware({ target: "http://auth:4001", changeOrigin: true, pathRewrite: {'^/auth': ''} }));
app.use("/wallet", createProxyMiddleware({ target: "http://wallet:4002", changeOrigin: true, pathRewrite: {'^/wallet': ''} }));
app.use("/sportsbook", createProxyMiddleware({ target: "http://sportsbook:4003", changeOrigin: true, pathRewrite: {'^/sportsbook': ''} }));
app.use("/games", createProxyMiddleware({ target: "http://games-provablyfair:4004", changeOrigin: true, pathRewrite: {'^/games': ''} }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API Gateway listening on ${port}`));
