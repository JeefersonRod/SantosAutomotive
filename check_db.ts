
import Database from "better-sqlite3";
const db = new Database("workshop.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", JSON.stringify(tables, null, 2));
for (const table of tables) {
    const info = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log(`Table info for ${table.name}:`, JSON.stringify(info, null, 2));
}
const staffCount = db.prepare("SELECT COUNT(*) as count FROM staff_members").get() as any;
console.log("Staff count:", staffCount.count);
