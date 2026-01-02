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
                    }
                });

                // Create indexes for performance
                db.run('CREATE INDEX IF NOT EXISTS idx_supplements_user_id ON supplements(user_id)');
                db.run('CREATE INDEX IF NOT EXISTS idx_federated_provider_subject ON federated_credentials(provider, subject)');

                // After all tables are created, create default admin if needed
                createDefaultAdmin();
            }
        });
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

