const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const databaseFile = databaseUrl.replace(/^file:/, "");
const databasePath = path.resolve(__dirname, databaseFile);
const migrationPath = path.join(__dirname, "migrations", "0001_init", "migration.sql");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(migrationPath, "utf8"));
db.close();

console.log(`SQLite database ready at ${databasePath}`);
