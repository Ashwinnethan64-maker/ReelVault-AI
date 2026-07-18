import app from './app';
import dotenv from 'dotenv';
import { startBackgroundWorker } from './services/queue.service';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start background job worker
startBackgroundWorker();

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
