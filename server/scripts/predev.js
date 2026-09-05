const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Ensure .env exists
const envPath = path.resolve(__dirname, '../.env');
const examplePath = path.resolve(__dirname, '../.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('📄 Created server/.env from .env.example');
}

// 2. Best-effort port cleanup if a zombie process is holding the port
const port = process.env.PORT || 5050;

try {
  if (process.platform === 'win32') {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const lines = output.trim().split('\n');
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid) && pid !== '0' && Number(pid) !== process.pid) {
        pids.add(pid);
      }
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`Freed port ${port} by terminating PID ${pid}`);
      } catch (_) {}
    }
  } else {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  }
} catch (_) {
  // Port is not in use or command failed; continue normally
}
