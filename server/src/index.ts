import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { db } from './db/database.js';
import authRouter from './controllers/auth.js';
import bankRouter from './controllers/bank.js';
import adminRouter from './controllers/admin.js';
import creditsRouter from './controllers/credits.js';
import savingsRouter from './controllers/savings.js';
import debtsRouter from './controllers/debts.js';
import scannerRouter from './controllers/scanner.js';
import { initWebSocket } from './websocket.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', dbConnected: !!db });
});

app.use('/api/auth', authRouter);
app.use('/api/bank', bankRouter);
app.use('/api/admin', adminRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/savings', savingsRouter);
app.use('/api/debts', debtsRouter);
app.use('/api/scanner', scannerRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

initWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
