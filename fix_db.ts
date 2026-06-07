import Database from "better-sqlite3";
const db = new Database("workshop.db");

function migrate(cmd: string) {
    try {
        db.exec(cmd);
        console.log(`SUCCESS: ${cmd}`);
    } catch (e: any) {
        console.log(`FAILED: ${cmd} - ${e.message}`);
    }
}

migrate("ALTER TABLE staff_members ADD COLUMN username TEXT");
migrate("CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_username ON staff_members(username)");
migrate("ALTER TABLE staff_members ADD COLUMN password TEXT");
migrate("ALTER TABLE staff_members ADD COLUMN permissions TEXT DEFAULT 'technician'");
migrate("ALTER TABLE staff_members ADD COLUMN phone TEXT");
migrate("ALTER TABLE staff_members ADD COLUMN email TEXT");
migrate("ALTER TABLE staff_members ADD COLUMN active INTEGER DEFAULT 1");

const info = db.pragma("table_info(staff_members)");
console.log("Final staff_members schema:", JSON.stringify(info, null, 2));
