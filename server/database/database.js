const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'smartfine.db');

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

console.log('Connected to SmartFine SQLite database.');

module.exports = db;