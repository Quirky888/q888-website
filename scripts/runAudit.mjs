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
const PORT = 4321;

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR);
}

async function runAudit(url, name) {
  console.log(`\n🚀 Auditing ${name} (${url})...`);
  
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
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

  // `.report` is the HTML report as a string
  const reportHtml = runnerResult.report;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name.replace(/\//g, 'home')}-${timestamp}.html`;
  const filePath = path.join(REPORTS_DIR, filename);

  fs.writeFileSync(filePath, reportHtml);

  console.log(`✅ Audit complete for ${name}.`);
  console.log(`📄 Report saved to: ${filePath}`);
  console.log(`📊 Performance score: ${runnerResult.lhr.categories.performance.score * 100}`);

  await chrome.kill();
}

async function main() {
  try {
    console.log('🏗️  Building project...');
    execSync('npm run build', { stdio: 'inherit', cwd: ROOT_DIR });

    console.log(`🌐 Starting local server on port ${PORT}...`);
    const server = http.createServer((request, response) => {
      return handler(request, response, {
        public: DIST_DIR,
      });
    });

    server.listen(PORT, async () => {
      console.log('✅ Server is running.');

      await runAudit(`http://localhost:${PORT}/`, 'home');
      await runAudit(`http://localhost:${PORT}/map`, 'map');

      console.log('\n🛑 Shutting down server...');
      server.close(() => {
        console.log('👋 All audits finished.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

main();
