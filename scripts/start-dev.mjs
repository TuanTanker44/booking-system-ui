import { spawn } from 'node:child_process';
import ngrok from '@ngrok/ngrok';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const port = 5173;

let vite;
let forwarder;
let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  if (forwarder) {
    await forwarder.close().catch(() => {});
  }

  if (vite && !vite.killed) {
    vite.kill('SIGTERM');
  }
}

async function main() {
  vite = spawn(
    'pnpm',
    ['exec', 'vite', '--host', '0.0.0.0', '--port', String(port)],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

  // Chờ Vite khởi động trước khi mở tunnel.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 2000);

    vite.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    vite.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Vite exited with code ${code}`));
    });
  });

  forwarder = await ngrok.forward({
    addr: `http://127.0.0.1:${port}`,
    authtoken_from_env: true,
  });

  console.log('\n================================');
  console.log('Frontend:', forwarder.url());
  console.log('================================\n');

  vite.on('exit', shutdown);

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(async (error) => {
  console.error(error);
  await shutdown();
  process.exitCode = 1;
});