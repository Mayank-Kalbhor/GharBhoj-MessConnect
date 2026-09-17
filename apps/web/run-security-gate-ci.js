const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 3005;

async function waitForServer(retries = 30, delayMs = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${PORT}/`, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.setTimeout(500, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Server failed to start on port ${PORT} within timeout.`);
}

async function runCiSecurityAudit() {
  console.log(`[CI Security Audit] Starting Next.js production server on port ${PORT}...`);

  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_PUBLIC_ALLOW_DEV_AUTH: 'false'
    },
    shell: true,
    stdio: 'ignore'
  });

  try {
    await waitForServer();
    console.log(`[CI Security Audit] Production server running on http://localhost:${PORT}. Executing audit...`);

    const audit = spawn('node', [path.join(__dirname, 'test-prod-security.js')], {
      stdio: 'inherit',
      shell: true
    });

    const exitCode = await new Promise(resolve => {
      audit.on('close', resolve);
    });

    if (exitCode !== 0) {
      console.error(`[CI Security Audit] FAILED with code ${exitCode}`);
      process.exit(exitCode);
    } else {
      console.log(`[CI Security Audit] PASSED cleanly.`);
    }
  } catch (err) {
    console.error('[CI Security Audit] Error during audit execution:', err.message);
    process.exit(1);
  } finally {
    console.log(`[CI Security Audit] Tearing down server on port ${PORT}...`);
    if (server.pid) {
      if (process.platform === 'win32') {
        try {
          require('child_process').execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: 'ignore' });
        } catch {}
      } else {
        server.kill('SIGTERM');
      }
    }
  }
}

runCiSecurityAudit();
