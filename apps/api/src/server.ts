import 'dotenv/config';
import { createApp } from './app';

const PORT = Number(process.env.PORT || 4000);
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

// خاموش‌سازی امن
function shutdown() {
  console.log('Shutting down...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
