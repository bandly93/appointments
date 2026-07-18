import express, { type Express, type Request, type Response } from 'express';
import authRouter from './routes/authRoutes.js'

const app: Express = express();
const port = 3000;

app.use(express.json());

app.use('/api/auth', authRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;