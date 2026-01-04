import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use DATA_PATH env var if set (for Docker), otherwise use current directory
const dataDir = process.env.DATA_PATH || __dirname;
const dbPath = path.join(dataDir, 'supplements.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT,
            password_hash TEXT,
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            // Migration for existing tables: Check if is_admin exists
            if (!err) {
                db.all("PRAGMA table_info(users)", (err, rows) => {
                    if (!err && rows) {
                        const hasAdmin = rows.some(r => r.name === 'is_admin');
                        if (!hasAdmin) {
                            db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0");
                        }
                    }
                });
            }
        });

        // Federated Credentials Table (for OIDC)
        db.run(`CREATE TABLE IF NOT EXISTS federated_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            provider TEXT NOT NULL,
            subject TEXT NOT NULL,
            UNIQUE(provider, subject),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // System Settings Table (for OIDC config)
        db.run(`CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // Supplements Table
        db.run(`CREATE TABLE IF NOT EXISTS supplements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            short_name TEXT,
            link TEXT,
            price REAL,
            quantity INTEGER,
            dosage TEXT,
            schedule_am INTEGER DEFAULT 0,
            schedule_pm INTEGER DEFAULT 0,
            schedule_am_pills INTEGER DEFAULT 1,
            schedule_pm_pills INTEGER DEFAULT 1,
            reason TEXT,
            ai_analysis TEXT,
            recommended_dosage TEXT,
            side_effects TEXT,
            rating INTEGER DEFAULT 0,
            archived INTEGER DEFAULT 0,
            cycle_on_days INTEGER,
            cycle_off_days INTEGER,
            cycle_start_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
            if (!err) {
                // Migration: Check for new columns
                db.all("PRAGMA table_info(supplements)", (err, rows) => {
                    if (!err && rows) {
                        const hasQuantity = rows.some(r => r.name === 'quantity');
                        if (!hasQuantity) {
                            console.log('Migrating database: Adding quantity column to supplements...');
                            db.run("ALTER TABLE supplements ADD COLUMN quantity INTEGER");
                        }

                        const hasUnitType = rows.some(r => r.name === 'unit_type');
                        if (!hasUnitType) {
                            console.log('Migrating database: Adding unit_type column to supplements...');
                            db.run("ALTER TABLE supplements ADD COLUMN unit_type TEXT DEFAULT 'pills'");
                        }

                        const hasCycleOn = rows.some(r => r.name === 'cycle_on_days');
                        if (!hasCycleOn) {
                            console.log('Migrating database: Adding cycle columns to supplements...');
                            db.run("ALTER TABLE supplements ADD COLUMN cycle_on_days INTEGER");
                            db.run("ALTER TABLE supplements ADD COLUMN cycle_off_days INTEGER");
                            db.run("ALTER TABLE supplements ADD COLUMN cycle_start_date TEXT");
                        }
                    }
                });

                // Create indexes for performance
                db.run('CREATE INDEX IF NOT EXISTS idx_supplements_user_id ON supplements(user_id)');
                db.run('CREATE INDEX IF NOT EXISTS idx_federated_provider_subject ON federated_credentials(provider, subject)');

                // After all tables are created, create default admin if needed
                createDefaultAdmin();
            }
        });

        // Analysis History Table (for saving AI stack analyses)
        db.run(`CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            summary TEXT,
            benefits TEXT,
            synergies TEXT,
            potential_risks TEXT,
            supplements_snapshot TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON analysis_history(user_id)');

        // Chat Sessions Table
        db.run(`CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_archived INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)');


        // Chat History Table (for AI chat conversations)
        db.run(`CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id INTEGER,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        )`, (err) => {
            if (!err) {
                // Migration: Check for session_id column
                db.all("PRAGMA table_info(chat_history)", (err, rows) => {
                    if (!err && rows) {
                        const hasSessionId = rows.some(r => r.name === 'session_id');
                        if (!hasSessionId) {
                            console.log('Migrating database: Adding session_id column to chat_history...');
                            db.serialize(() => {
                                db.run("ALTER TABLE chat_history ADD COLUMN session_id INTEGER");

                                // Migrate existing orphan messages
                                db.all("SELECT DISTINCT user_id FROM chat_history WHERE session_id IS NULL", (err, users) => {
                                    if (!err && users) {
                                        users.forEach(u => {
                                            db.run("INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)", [u.user_id, 'Previous Chat'], function (err) {
                                                if (!err) {
                                                    const sessionId = this.lastID;
                                                    db.run("UPDATE chat_history SET session_id = ? WHERE user_id = ? AND session_id IS NULL", [sessionId, u.user_id]);
                                                }
                                            });
                                        });
                                    }
                                });
                                // Create index AFTER column is added
                                db.run('CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id)');
                            });
                        } else {
                            // Column exists, just ensure index exists
                            db.run('CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id)');
                        }
                    }
                });
            }
        });
        db.run('CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id)');

        // Shared Stacks Table (for public stack sharing)
        db.run(`CREATE TABLE IF NOT EXISTS shared_stacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            share_code TEXT UNIQUE NOT NULL,
            title TEXT,
            description TEXT,
            supplements_snapshot TEXT NOT NULL,
            is_public INTEGER DEFAULT 1,
            view_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_shared_stacks_code ON shared_stacks(share_code)');
    });
}

function createDefaultAdmin() {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if any users exist
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
            console.error('Error checking for existing users:', err.message);
            return;
        }

        if (row.count === 0 && adminPassword) {
            // No users exist and admin password is configured - create default admin
            bcrypt.hash(adminPassword, 10, (err, hash) => {
                if (err) {
                    console.error('Error hashing admin password:', err.message);
                    return;
                }

                db.run('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)',
                    [adminUsername, hash],
                    function (err) {
                        if (err) {
                            console.error('Error creating default admin user:', err.message);
                        } else {
                            console.log(`Default admin user '${adminUsername}' created successfully.`);
                        }
                    }
                );
            });
        } else if (row.count === 0 && !adminPassword) {
            console.log('No ADMIN_PASSWORD set. Skipping default admin creation. First registered user will be admin.');
        }
    });
}

export default db;

