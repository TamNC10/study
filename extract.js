const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const INPUT_FILE = path.join(__dirname, 'input', 'groups.json');
const RAW_HTML_DIR = path.join(__dirname, 'data', 'raw_html');
const OUTPUT_DIR = path.join(__dirname, 'data', 'output');
const PROCESSED_DIR = path.join(__dirname, 'data', 'processed');

const PARENT_SELECTOR = '.SetPageTermsList-term';
const CHILD_SELECTOR = '[data-testid="set-page-term-card-side"]';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function extractTermsFromHtml(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const terms = [];

  $(PARENT_SELECTOR).each((_, termEl) => {
    const sides = $(termEl).find(CHILD_SELECTOR);
    if (sides.length >= 2) {
      const kanji = $(sides[0]).text().trim();
      const definition = $(sides[1]).text().trim();
      terms.push({ kanji, definition });
    }
  });

  return terms;
}

function main() {
  const groups = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

  for (const [groupName, files] of Object.entries(groups)) {
    const groupRawDir = path.join(RAW_HTML_DIR, groupName);
    const groupOutputDir = path.join(OUTPUT_DIR, groupName);
    const groupProcessedDir = path.join(PROCESSED_DIR, groupName);

    ensureDir(groupOutputDir);
    ensureDir(groupProcessedDir);

    for (const fileObj of files) {
      const [label, htmlFileName] = Object.entries(fileObj)[0];
      const htmlFilePath = path.join(groupRawDir, htmlFileName);

      if (!fs.existsSync(htmlFilePath)) {
        console.warn(`[SKIP] File not found: ${htmlFilePath}`);
        continue;
      }

      const jsonFileName = htmlFileName.replace(/\.html$/, '.json');
      const outputFilePath = path.join(groupOutputDir, jsonFileName);
      const processedFilePath = path.join(groupProcessedDir, htmlFileName);

      // Skip if already processed
      if (fs.existsSync(processedFilePath)) {
        console.log(`[SKIP] Already processed: ${groupName}/${htmlFileName}`);
        continue;
      }

      console.log(`[PROCESSING] ${groupName}/${htmlFileName} (${label})`);

      const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
      const terms = extractTermsFromHtml(htmlContent);

      if (terms.length === 0) {
        console.warn(`[WARN] No terms found in: ${groupName}/${htmlFileName}`);
      } else {
        console.log(`  -> Extracted ${terms.length} terms`);
      }

      // Save JSON output
      fs.writeFileSync(outputFilePath, JSON.stringify(terms, null, 2), 'utf-8');

      // Move HTML to processed folder
      fs.renameSync(htmlFilePath, processedFilePath);
      console.log(`  -> Moved to processed: ${groupName}/${htmlFileName}`);
    }
  }

  console.log('\nDone!');
}

main();
