// src/server.ts
import "dotenv/config";
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors'
import authRouter from './auth/auth.routes.js'

process.loadEnvFile()

const app: Express = express();
const port = process.env.PORT ?? 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;