
import Database from "better-sqlite3";
const db = new Database("workshop.db");
try {
    db.exec("ALTER TABLE staff_members ADD COLUMN username TEXT UNIQUE");
    console.log("Success adding username");
} catch (e: any) {
    console.error("Error adding username:", e.message);
}
