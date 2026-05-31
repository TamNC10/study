const fs = require('fs');
const path = require('path');

const GROUPS_FILE = path.join(__dirname, 'input', 'groups.json');
const OUTPUT_DIR = path.join(__dirname, 'data', 'output');
const DB_DIR = path.join(__dirname, 'data', 'database');
const DB_FILE = path.join(DB_DIR, 'quizlet_db.json');
const DB_PWA_DIR = path.join(__dirname,'pwa-app', 'public', 'data', 'database');
const DB_PWA_DIR_FILE = path.join(DB_PWA_DIR, 'quizlet_db.json');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function buildLessonLookup(groupsConfig) {
  const lookup = new Map();

  for (const [groupName, lessons] of Object.entries(groupsConfig)) {
    for (const lessonObj of lessons) {
      const [lessonName, htmlFile] = Object.entries(lessonObj)[0];
      const jsonFile = htmlFile.replace(/\.html$/i, '.json');
      lookup.set(`${groupName}/${jsonFile}`, lessonName);
    }
  }

  return lookup;
}

function loadOutputAsDatabase() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    throw new Error(`Output directory not found: ${OUTPUT_DIR}`);
  }

  const groupsConfig = fs.existsSync(GROUPS_FILE) ? readJsonFile(GROUPS_FILE) : {};
  const lessonLookup = buildLessonLookup(groupsConfig);

  const database = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'data/output',
      totalGroups: 0,
      totalSets: 0,
      totalCards: 0
    },
    groups: {},
    sets: [],
    cards: []
  };

  const groupDirs = fs
    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  for (const groupName of groupDirs) {
    const groupPath = path.join(OUTPUT_DIR, groupName);
    const jsonFiles = fs
      .readdirSync(groupPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    database.groups[groupName] = {
      totalSets: jsonFiles.length,
      totalCards: 0,
      sets: []
    };

    for (const jsonFileName of jsonFiles) {
      const jsonFilePath = path.join(groupPath, jsonFileName);
      const payload = readJsonFile(jsonFilePath);
      const rows = Array.isArray(payload) ? payload : [];
      const setId = path.basename(jsonFileName, '.json');
      const lessonName = lessonLookup.get(`${groupName}/${jsonFileName}`) || null;

      const normalizedItems = rows
        .map((row) => ({
          kanji: String(row?.kanji || '').trim(),
          definition: String(row?.definition || '').trim()
        }))
        .filter((row) => row.kanji || row.definition);

      const setRecord = {
        id: setId,
        group: groupName,
        lesson: lessonName,
        sourceFile: `data/output/${groupName}/${jsonFileName}`,
        totalCards: normalizedItems.length,
        items: normalizedItems
      };

      database.groups[groupName].sets.push({
        id: setId,
        lesson: lessonName,
        totalCards: normalizedItems.length
      });
      database.groups[groupName].totalCards += normalizedItems.length;

      database.sets.push(setRecord);

      normalizedItems.forEach((item, index) => {
        database.cards.push({
          id: `${setId}-${index + 1}`,
          group: groupName,
          lesson: lessonName,
          setId,
          kanji: item.kanji,
          definition: item.definition
        });
      });
    }
  }

  database.meta.totalGroups = groupDirs.length;
  database.meta.totalSets = database.sets.length;
  database.meta.totalCards = database.cards.length;

  return database;
}

function saveDatabase(db) {
  ensureDir(DB_DIR);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');

  ensureDir(DB_PWA_DIR);
  fs.writeFileSync(DB_PWA_DIR_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function main() {
  const db = loadOutputAsDatabase();
  saveDatabase(db);

  console.log('Database generated successfully.');
  console.log(`- File: ${DB_FILE}`);
  console.log(`- Groups: ${db.meta.totalGroups}`);
  console.log(`- Sets: ${db.meta.totalSets}`);
  console.log(`- Cards: ${db.meta.totalCards}`);
}

main();
