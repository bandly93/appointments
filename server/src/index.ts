import express, { type Express, type Request, type Response } from 'express';
import auth from './routes/authenticate.js'

const app: Express = express();
const port = 3000;

app.use(auth)

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app