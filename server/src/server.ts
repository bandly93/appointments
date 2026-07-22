// src/server.ts
import "dotenv/config";
import express, { type Express } from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './auth/auth.routes.js'
import usersRouter from './users/users.routes.js'
import availabilityRouter from './availability/availability.routes.js'
import { errorHandler, notFoundHandler } from './lib/errorHandler.js'

process.loadEnvFile()

const app: Express = express();
const port = process.env.PORT ?? 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/availability', availabilityRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;