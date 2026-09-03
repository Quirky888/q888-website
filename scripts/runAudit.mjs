import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import http from 'http';
import handler from 'serve-handler';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');
const AUDIT_HOST = '127.0.0.1';

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR);
}

async function runAudit(url, name) {
  console.log(`\n🚀 Auditing ${name} (${url})...`);

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  try {
    const options = {
      logLevel: 'info',
      output: 'html',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 360,
        height: 640,
        deviceScaleFactor: 2,
        disabled: false,
      },
      throttlingMethod: 'simulate',
    };

    const runnerResult = await lighthouse(url, options);
    if (!runnerResult) throw new Error(`Lighthouse returned no result for ${name}`);

    // `.report` is the HTML report as a string
    const reportHtml = runnerResult.report;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name.replace(/\//g, 'home')}-${timestamp}.html`;
    const filePath = path.join(REPORTS_DIR, filename);

    fs.writeFileSync(filePath, reportHtml);

    console.log(`✅ Audit complete for ${name}.`);
    console.log(`📄 Report saved to: ${filePath}`);
    console.log(`📊 Performance score: ${runnerResult.lhr.categories.performance.score * 100}`);
  } finally {
    chrome.kill();
  }
}

async function startAuditServer() {
  const server = http.createServer((request, response) => {
    return handler(request, response, { public: DIST_DIR });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, AUDIT_HOST, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Could not determine the local audit server port');
  }

  return { server, origin: `http://${AUDIT_HOST}:${address.port}` };
}

async function main() {
  let server;
  try {
    console.log('🏗️  Building project...');
    execSync('npm run build', { stdio: 'inherit', cwd: ROOT_DIR });

    const started = await startAuditServer();
    server = started.server;
    console.log(`🌐 Production audit server: ${started.origin}`);

    await runAudit(`${started.origin}/`, 'home');
    await runAudit(`${started.origin}/map`, 'map');

    console.log('👋 All audits finished.');
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      console.log('\n🛑 Shutting down server...');
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

main();
