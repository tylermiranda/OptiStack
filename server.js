import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import db from './database.js';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret Management
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not found in environment.');
    console.warn('   Generating a random secret for this session.');
    console.warn('   Sessions and tokens will be invalidated on server restart.');
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
}

// Log Buffer Implementation
const LOG_BUFFER_SIZE = 1000;
const logBuffer = [];

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

const addToBuffer = (level, args) => {
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    logBuffer.push({
        timestamp: new Date().toISOString(),
        level,
        message
    });

    if (logBuffer.length > LOG_BUFFER_SIZE) {
        logBuffer.shift();
    }
};

console.log = (...args) => {
    addToBuffer('info', args);
    originalConsoleLog.apply(console, args);
};

console.warn = (...args) => {
    addToBuffer('warn', args);
    originalConsoleWarn.apply(console, args);
};

console.error = (...args) => {
    addToBuffer('error', args);
    originalConsoleError.apply(console, args);
};

// Rate Limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts' } });
const scrapeLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: 'Too many scrape requests' } });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/api/', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/scrape', scrapeLimiter);

// Session Secret Management
let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.warn('⚠️  WARNING: SESSION_SECRET not found in environment.');
    console.warn('   Generating a random secret for this session.');
    SESSION_SECRET = crypto.randomBytes(64).toString('hex');
}

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.authenticate('session'));

// Passport OIDC Configuration (Dynamic)
const configurePassport = () => {
    // defaults from env
    const defaultOptions = {
        issuer: process.env.OIDC_ISSUER || 'https://issuer.example.com',
        authorizationURL: process.env.OIDC_AUTH_URL || 'https://issuer.example.com/authorize',
        tokenURL: process.env.OIDC_TOKEN_URL || 'https://issuer.example.com/token',
        userInfoURL: process.env.OIDC_USERINFO_URL || 'https://issuer.example.com/userinfo',
        clientID: process.env.OIDC_CLIENT_ID || 'client-id',
        clientSecret: process.env.OIDC_CLIENT_SECRET || 'client-secret',
        callbackURL: process.env.OIDC_CALLBACK_URL || `http://localhost:${PORT}/auth/callback`,
        scope: 'openid profile email'
    };

    // Try to load from DB, fallback to env
    db.all('SELECT * FROM system_settings', (err, rows) => {
        if (!err && rows) {
            rows.forEach(row => {
                if (row.value) {
                    switch (row.key) {
                        case 'OIDC_ISSUER': defaultOptions.issuer = row.value; break;
                        case 'OIDC_AUTH_URL': defaultOptions.authorizationURL = row.value; break;
                        case 'OIDC_TOKEN_URL': defaultOptions.tokenURL = row.value; break;
                        case 'OIDC_USERINFO_URL': defaultOptions.userInfoURL = row.value; break;
                        case 'OIDC_CLIENT_ID': defaultOptions.clientID = row.value; break;
                        case 'OIDC_CLIENT_SECRET': defaultOptions.clientSecret = row.value; break;
                        case 'OIDC_CALLBACK_URL': defaultOptions.callbackURL = row.value; break;
                    }
                }
            });
            console.log('Loaded OIDC Settings:', defaultOptions);
        }

        try {
            // Remove existing strategy if any - hacky but effective for hot reloading strategy
            passport.unuse('openidconnect');
        } catch (e) { }

        passport.use(new OpenIDConnectStrategy(defaultOptions, function verify(issuer, profile, cb) {
            const subject = profile.id || profile.sub;
            const issuerUrl = defaultOptions.issuer || 'unknown'; // Use configured issuer

            db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
                issuerUrl,
                subject
            ], function (err, row) {
                if (err) return cb(err);

                if (!row) {
                    const username = profile.displayName || profile.username || 'User ' + subject.slice(-4);
                    const email = profile.emails?.[0]?.value || null;

                    db.run('INSERT INTO users (username, email) VALUES (?, ?)', [
                        username,
                        email
                    ], function (err) {
                        if (err) return cb(err);
                        const userId = this.lastID;
                        db.run('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
                            userId,
                            issuerUrl,
                            subject
                        ], function (err) {
                            if (err) return cb(err);
                            return cb(null, { id: userId, username, is_admin: 0 });
                        });
                    });
                } else {
                    db.get('SELECT * FROM users WHERE id = ?', [row.user_id], function (err, user) {
                        if (err) return cb(err);
                        if (!user) return cb(null, false);
                        return cb(null, user);
                    });
                }
            });
        }));
    });
};

// Initial config
// Initial config
if (!DISABLE_AUTH) {
    configurePassport();
}

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, is_admin: user.is_admin });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
    if (DISABLE_AUTH) {
        req.user = { id: 1, username: 'admin', is_admin: 1 };
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
    if (DISABLE_AUTH) return next();

    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Auth Routes

// Public Config
app.get('/api/public/config', (req, res) => {
    res.json({
        authDisabled: DISABLE_AUTH
    });
});

// OIDC Login
app.get('/auth/login', (req, res, next) => {
    // Reload strategy options just in case they changed
    configurePassport();
    passport.authenticate('openidconnect')(req, res, next);
});

// OIDC Callback
app.get('/auth/callback', passport.authenticate('openidconnect', {
    failureRedirect: '/login',
    failWithError: true
}), (req, res) => {
    // Generat JWT
    const token = jwt.sign({ id: req.user.id, username: req.user.username, is_admin: req.user.is_admin }, JWT_SECRET, { expiresIn: '1h' });

    // Redirect to frontend
    db.get('SELECT value FROM system_settings WHERE key = ?', ['FRONTEND_URL'], (err, row) => {
        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        if (!err && row && row.value) {
            frontendUrl = row.value;
        }
        res.redirect(`${frontendUrl}/?token=${token}`);
    });
}, (err, req, res, next) => {
    console.error('Auth error:', err);
    res.redirect('/?error=auth_failed');
});

// Admin Routes

// Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, username, email, is_admin, created_at FROM users', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Promote/Demote User
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
    const { is_admin } = req.body;
    db.run('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'User role updated' });
    });
});

// Get OIDC Settings
app.get('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT * FROM system_settings', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
});

// Update OIDC Settings
app.post('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
    const settings = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        Object.keys(settings).forEach(key => {
            stmt.run(key, settings[key]);
        });
        db.run('COMMIT', (err) => {
            stmt.finalize();
            if (err) return res.status(500).json({ error: 'Database error' });
            configurePassport(); // Apply new settings
            res.json({ message: 'Settings saved' });
        });
    });
});

// User Settings Routes
// Get User Settings (Wake Time)
app.get('/api/user/settings', authenticateToken, (req, res) => {
    db.get('SELECT wake_time FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ wakeTime: row?.wake_time || '07:00' });
    });
});

// Update User Settings (Wake Time)
app.post('/api/user/settings', authenticateToken, (req, res) => {
    const { wakeTime } = req.body;

    // Basic validation for HH:MM format
    if (wakeTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(wakeTime)) {
        return res.status(400).json({ error: 'Invalid time format (HH:MM required)' });
    }

    if (wakeTime) {
        db.run('UPDATE users SET wake_time = ? WHERE id = ?', [wakeTime, req.user.id], function (err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Settings saved', wakeTime });
        });
    } else {
        res.json({ message: 'No changes' });
    }
});


// Get System Logs
app.get('/api/admin/logs', authenticateToken, requireAdmin, (req, res) => {
    res.json(logBuffer);
});

// Maintenance Routes

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// Download Backup
app.get('/api/admin/backup', authenticateToken, requireAdmin, (req, res) => {
    // Get DB path from environment or default (same logic as database.js)
    const dataDir = process.env.DATA_PATH || __dirname;
    const dbPath = path.join(dataDir, 'supplements.db');

    if (fs.existsSync(dbPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        res.download(dbPath, `supplements_backup_${timestamp}.db`);
    } else {
        res.status(404).json({ error: 'Database file not found' });
    }
});

// Restore Backup
app.post('/api/admin/restore', authenticateToken, requireAdmin, upload.single('backup'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const dataDir = process.env.DATA_PATH || __dirname;
    const dbPath = path.join(dataDir, 'supplements.db');
    const backupPath = req.file.path;

    // Safety check: Ensure it's a valid SQLite file (basic check)
    // For now we trust the admin input but could add header checks

    try {
        // Prepare to overwrite
        // We use fs.copyFile to overwrite.
        // NOTE: In a high-traffic production app, we should close the DB connection first.
        // but explicit close isn't strictly exposed in our database.js wrapper effortlessly without adding a method.
        // However, FS operations on linux/mac are usually atomic enough for a replacement, or valid enough to crash and restart.

        fs.copyFileSync(backupPath, dbPath);

        // Cleanup uploaded file
        fs.unlinkSync(backupPath);

        res.json({ message: 'Restore successful. Server restarting...' });

        // Restart server to reload DB connection safely
        // In Docker/Nodemon environments, exiting process triggers a restart
        setTimeout(() => {
            console.log('Restarting server after restore...');
            process.exit(0);
        }, 1000);

    } catch (error) {
        console.error('Restore failed:', error);
        res.status(500).json({ error: 'Restore failed: ' + error.message });
    }
});

// Manual Register
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Encryption failed' });

        // First user is admin
        db.get('SELECT count(*) as count FROM users', (err, row) => {
            const isAdmin = (row && row.count === 0) ? 1 : 0;

            db.run('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)', [username, hash, isAdmin], function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ id: this.lastID, username, is_admin: isAdmin });
            });
        });
    });
});

// Manual Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

        bcrypt.compare(password, user.password_hash, (err, result) => {
            if (result) {
                console.log('Login success: ', { id: user.id, username: user.username, is_admin: user.is_admin });
                const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '1h' });
                res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin } });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    });
});

// Debug endpoint - only available in development
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug-env', (req, res) => {
        res.json({
            frontendUrl: process.env.FRONTEND_URL,
            callbackUrl: process.env.OIDC_CALLBACK_URL,
            port: process.env.PORT
        });
    });
}

// Browser pool for Puppeteer (reuse browser instance)
let browserInstance = null;

const getBrowser = async () => {
    if (!browserInstance || !browserInstance.isConnected()) {
        browserInstance = await puppeteer.launch({
            headless: "new",
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
    }
    return browserInstance;
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    if (browserInstance) await browserInstance.close();
    process.exit(0);
});

// ===========================================
// AI Provider Abstraction (OpenRouter + Ollama)
// ===========================================

// Helper to get AI settings from database (async)
const getAISettings = () => {
    return new Promise((resolve) => {
        db.all("SELECT key, value FROM system_settings WHERE key LIKE 'AI_%' OR key LIKE 'OLLAMA_%' OR key = 'OPENROUTER_API_KEY'",
            (err, rows) => {
                if (err) {
                    resolve({});
                    return;
                }
                const settings = {};
                (rows || []).forEach(r => settings[r.key] = r.value);
                resolve(settings);
            });
    });
};

// Create AI provider based on config (database settings override env vars)
const createAIProvider = (config = {}) => {
    // Database settings take priority over environment variables
    const provider = (config.AI_PROVIDER || process.env.AI_PROVIDER || 'openrouter').toLowerCase();

    // Handle "No AI" selection - always return unavailable
    if (provider === 'none') {
        return {
            type: 'none',
            defaultModel: null,
            isAvailable: async () => false,
            getModels: async () => [],
            chat: async () => { throw new Error('AI is disabled'); }
        };
    }

    if (provider === 'ollama') {
        const ollamaUrl = config.OLLAMA_URL || process.env.OLLAMA_URL || 'http://localhost:11434';
        const defaultModel = config.OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'llama3.1:8b';

        return {
            type: 'ollama',
            url: ollamaUrl,
            defaultModel,
            isAvailable: async () => {
                try {
                    const res = await fetch(`${ollamaUrl}/api/tags`, {
                        signal: AbortSignal.timeout(3000)
                    });
                    return res.ok;
                } catch {
                    return false;
                }
            },
            getModels: async () => {
                try {
                    console.log(`[Ollama] Fetching models from ${ollamaUrl}/api/tags`);
                    const res = await fetch(`${ollamaUrl}/api/tags`);
                    if (!res.ok) {
                        console.error(`[Ollama] Failed to fetch tags: ${res.status}`);
                        return [];
                    }
                    const data = await res.json();
                    console.log(`[Ollama] Raw models:`, JSON.stringify(data.models?.map(m => m.name)));
                    return (data.models || []).map(m => ({
                        id: m.name,
                        name: m.name,
                        size: m.size
                    }));
                } catch (e) {
                    console.error(`[Ollama] Error fetching models:`, e.message);
                    return [];
                }
            },
            chat: async (model, messages, options = {}) => {
                const targetModel = (model || defaultModel || '').trim();
                console.log(`[Ollama] Sending chat request to ${ollamaUrl}/api/chat`);

                const format = options?.format;
                console.log(`[Ollama] Model: ${targetModel} ${format ? `(Format: ${format})` : ''}`);

                try {
                    console.log(`[Ollama] Waiting for response... (timeout 120s)`);
                    const res = await fetch(`${ollamaUrl}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: targetModel,
                            messages,
                            stream: false,
                            format: format || undefined // Support JSON mode if requested
                        }),
                        signal: AbortSignal.timeout(120000) // 2 minute timeout
                    });

                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error(`[Ollama] Error Status: ${res.status}`);
                        console.error(`[Ollama] Error Body: ${errorText}`);

                        let errorData = {};
                        try {
                            errorData = JSON.parse(errorText);
                        } catch (e) {
                            errorData = { error: errorText };
                        }

                        throw new Error(errorData.error || `Ollama returned status ${res.status}`);
                    }

                    const data = await res.json();
                    const preview = data.message?.content ? data.message.content.substring(0, 200) + '...' : 'Empty';
                    console.log(`[Ollama] Response received. Model: ${data.model}, Content length: ${data.message?.content?.length}`);
                    console.log(`[Ollama] Content preview: ${preview}`);

                    if (!data.message?.content) {
                        console.warn(`[Ollama] Warning: Empty content received! Full response:`, JSON.stringify(data));
                    }

                    return {
                        content: data.message?.content || '',
                        model: data.model,
                        usage: {
                            prompt_tokens: 0,
                            completion_tokens: 0,
                            total_tokens: 0,
                            cost: 0  // Local AI has no cost
                        }
                    };
                } catch (error) {
                    if (error.name === 'TimeoutError') {
                        console.error(`[Ollama] Request timed out after 120s`);
                    } else {
                        console.error(`[Ollama] Connection Failed:`, error.message);
                    }
                    throw error;
                }
            }
        };
    }

    // OpenRouter (default)
    const apiKey = config.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    return {
        type: 'openrouter',
        defaultModel: 'google/gemini-2.0-flash-001',
        isAvailable: async () => !!apiKey,
        getModels: async () => {
            if (!apiKey) return [];
            try {
                const res = await fetch('https://openrouter.ai/api/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                        'X-Title': 'OptiStack'
                    },
                    signal: AbortSignal.timeout(10000)
                });
                if (!res.ok) return [];
                const data = await res.json();

                const models = (data.data || []).map(m => ({
                    id: m.id,
                    name: m.name || m.id
                }));

                return models.sort((a, b) => a.name.localeCompare(b.name));
            } catch (e) {
                console.error('[OpenRouter] Failed to fetch models:', e.message);
                return [];
            }
        },
        chat: async (model, messages, options = {}) => {
            if (!apiKey) {
                throw new Error('OPENROUTER_API_KEY is not configured');
            }

            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                    'X-Title': 'OptiStack'
                },
                body: JSON.stringify({
                    model: model || 'google/gemini-2.0-flash-001',
                    messages,
                    usage: { include: true }  // Request usage data for cost tracking
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error?.message || `OpenRouter returned status ${res.status}`);
            }

            // Extract usage data from response
            const usage = data.usage || {};

            return {
                content: data.choices[0]?.message?.content || '',
                model: data.model,
                usage: {
                    prompt_tokens: usage.prompt_tokens || 0,
                    completion_tokens: usage.completion_tokens || 0,
                    total_tokens: usage.total_tokens || 0,
                    cost: usage.cost || 0
                }
            };
        }
    };
};

// Get AI provider with database settings
const getAIProvider = async () => {
    const settings = await getAISettings();
    return createAIProvider(settings);
};

// Helper to save AI usage for cost tracking
const saveAIUsage = (userId, provider, model, usage, requestType) => {
    db.run(`INSERT INTO ai_usage (user_id, provider, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, request_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        userId,
        provider,
        model || 'unknown',
        usage?.prompt_tokens || 0,
        usage?.completion_tokens || 0,
        usage?.total_tokens || 0,
        usage?.cost || 0,
        requestType
    ], (err) => {
        if (err) {
            console.error('[AI Usage] Failed to save usage:', err.message);
        }
    });
};

// AI Settings Endpoint - get current AI configuration
app.get('/api/ai/settings', authenticateToken, async (req, res) => {
    const settings = await getAISettings();

    // Return current config (don't expose full API key)
    res.json({
        provider: settings.AI_PROVIDER || process.env.AI_PROVIDER || 'openrouter',
        ollamaUrl: settings.OLLAMA_URL || process.env.OLLAMA_URL || 'http://localhost:11434',
        ollamaModel: settings.OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'llama3.1:8b',
        defaultModel: settings.AI_DEFAULT_MODEL || process.env.AI_DEFAULT_MODEL,
        hasOpenRouterKey: !!(settings.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY),
        // Indicate if settings come from env or database
        configSource: settings.AI_PROVIDER ? 'database' : 'environment'
    });
});

// AI Settings Endpoint - update AI configuration
app.post('/api/ai/settings', authenticateToken, async (req, res) => {
    const { provider, ollamaUrl, ollamaModel, openRouterKey } = req.body;

    const stmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        if (provider) {
            stmt.run('AI_PROVIDER', provider);
        }
        if (ollamaUrl) {
            stmt.run('OLLAMA_URL', ollamaUrl);
        }
        if (ollamaModel) {
            stmt.run('OLLAMA_MODEL', ollamaModel);
        }
        if (openRouterKey !== undefined) {
            // Allow setting or clearing the key
            if (openRouterKey) {
                stmt.run('OPENROUTER_API_KEY', openRouterKey);
            } else {
            }
        }
        if (req.body.defaultModel) {
            stmt.run('AI_DEFAULT_MODEL', req.body.defaultModel);
        }

        db.run('COMMIT', (err) => {
            stmt.finalize();
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'AI settings saved' });
        });
    });
});

// Test Ollama Connection
app.post('/api/ai/test-ollama', authenticateToken, async (req, res) => {
    const { url } = req.body;
    const testUrl = url || 'http://localhost:11434';

    try {
        const response = await fetch(`${testUrl}/api/tags`, {
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            const data = await response.json();
            const models = (data.models || []).map(m => m.name);
            res.json({
                success: true,
                message: `Connected to Ollama. ${models.length} models available.`,
                models
            });
        } else {
            res.json({ success: false, message: `Ollama returned status ${response.status}` });
        }
    } catch (error) {
        res.json({
            success: false,
            message: `Could not connect to Ollama at ${testUrl}. Make sure Ollama is running.`
        });
    }
});

// Test OpenRouter Connection
app.post('/api/ai/test-openrouter', authenticateToken, async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.json({ success: false, message: 'API key is required' });
    }

    try {
        // Test by fetching models from OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.OPENROUTER_REFERRER || 'http://localhost:3000',
                'X-Title': 'OptiStack'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
            const data = await response.json();
            const models = (data.data || [])
                .map(m => ({ id: m.id, name: m.name || m.id }));

            // Sort models alphabetically
            models.sort((a, b) => a.name.localeCompare(b.name));

            res.json({
                success: true,
                message: `API key valid! ${models.length} models available.`,
                models: models
            });
        } else if (response.status === 401) {
            res.json({ success: false, message: 'Invalid API key. Please check and try again.' });
        } else {
            res.json({ success: false, message: `OpenRouter returned status ${response.status}` });
        }
    } catch (error) {
        res.json({
            success: false,
            message: `Could not connect to OpenRouter. Error: ${error.message}`
        });
    }
});

// AI Status Endpoint - tells frontend if AI is available and which provider
app.get('/api/ai/status', async (req, res) => {
    const provider = await getAIProvider();
    const available = await provider.isAvailable();

    res.json({
        available,
        provider: provider.type,
        defaultModel: provider.defaultModel,
        ollamaUrl: provider.type === 'ollama' ? provider.url : undefined
    });
});

// AI Models Endpoint - returns available models for current provider
app.get('/api/ai/models', async (req, res) => {
    const provider = await getAIProvider();
    const available = await provider.isAvailable();

    if (!available) {
        return res.status(503).json({
            error: provider.type === 'ollama'
                ? 'Ollama is not reachable. Make sure Ollama is running.'
                : 'OpenRouter API key not configured.'
        });
    }

    const models = await provider.getModels();
    res.json({
        provider: provider.type,
        models
    });
});

// AI Usage Endpoint - returns user's AI usage summary for cost tracking
app.get('/api/ai/usage', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD
    const firstOfMonth = today.substring(0, 8) + '01';  // YYYY-MM-01

    // Get usage statistics in parallel
    const queries = {
        today: `SELECT 
                    COUNT(*) as requests,
                    COALESCE(SUM(total_tokens), 0) as tokens,
                    COALESCE(SUM(cost_usd), 0) as cost
                FROM ai_usage 
                WHERE user_id = ? AND date(created_at) = date(?)`,
        thisMonth: `SELECT 
                    COUNT(*) as requests,
                    COALESCE(SUM(total_tokens), 0) as tokens,
                    COALESCE(SUM(cost_usd), 0) as cost
                FROM ai_usage 
                WHERE user_id = ? AND date(created_at) >= date(?)`,
        total: `SELECT 
                    COUNT(*) as requests,
                    COALESCE(SUM(total_tokens), 0) as tokens,
                    COALESCE(SUM(cost_usd), 0) as cost
                FROM ai_usage 
                WHERE user_id = ?`,
        recent: `SELECT id, provider, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, request_type, created_at
                FROM ai_usage 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 10`,
        byModel: `SELECT 
                    model, 
                    provider, 
                    COUNT(*) as requests, 
                    COALESCE(SUM(total_tokens), 0) as tokens, 
                    COALESCE(SUM(cost_usd), 0) as cost
                FROM ai_usage 
                WHERE user_id = ? 
                GROUP BY model, provider 
                ORDER BY cost DESC`
    };

    const result = {};

    db.get(queries.today, [userId, today], (err, todayData) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        result.today = todayData || { requests: 0, tokens: 0, cost: 0 };

        db.get(queries.thisMonth, [userId, firstOfMonth], (err, monthData) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            result.thisMonth = monthData || { requests: 0, tokens: 0, cost: 0 };

            db.get(queries.total, [userId], (err, totalData) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                result.total = totalData || { requests: 0, tokens: 0, cost: 0 };

                db.all(queries.recent, [userId], (err, recentData) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    result.recentRequests = recentData || [];

                    db.all(queries.byModel, [userId], (err, modelData) => {
                        if (err) return res.status(500).json({ error: 'Database error' });
                        result.usageByModel = modelData || [];

                        res.json(result);
                    });
                });
            });
        });
    });
});

// AI Proxy Endpoint (keeps API keys server-side)
app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
    const { prompt, model, format } = req.body;
    const provider = await getAIProvider();

    try {
        const available = await provider.isAvailable();
        if (!available) {
            const errorMsg = provider.type === 'ollama'
                ? 'Ollama is not reachable. Make sure Ollama is running.'
                : 'AI not configured. Please set OPENROUTER_API_KEY in .env.';
            console.warn(`[AI Analyze] Provider unavailability: ${errorMsg}`);
            return res.status(500).json({ error: errorMsg });
        }

        console.log(`[AI Analyze] Using provider: ${provider.type}`);
        console.log(`[AI Analyze] Requested model: ${model}`);

        const result = await provider.chat(model, [{ role: 'user', content: prompt }], { format });

        // Track AI usage for cost estimation
        saveAIUsage(req.user.id, provider.type, result.model || model, result.usage, 'analyze');

        // Return in the format expected by the frontend
        res.json({
            choices: [{
                message: {
                    content: result.content
                }
            }]
        });
    } catch (error) {
        console.error('AI Proxy Error:', error.message);
        res.status(500).json({ error: 'AI request failed: ' + error.message });
    }
});

// Analysis History Endpoints

// Save Analysis
app.post('/api/ai/analysis-history', authenticateToken, (req, res) => {
    const { summary, benefits, synergies, potential_risks, supplements } = req.body;

    db.run(`INSERT INTO analysis_history (user_id, summary, benefits, synergies, potential_risks, supplements_snapshot) 
            VALUES (?, ?, ?, ?, ?, ?)`, [
        req.user.id,
        summary,
        JSON.stringify(benefits),
        JSON.stringify(synergies),
        JSON.stringify(potential_risks),
        JSON.stringify(supplements)
    ], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to save analysis' });
        res.json({ id: this.lastID, created_at: new Date().toISOString() });
    });
});

// Get Analysis History
app.get('/api/ai/analysis-history', authenticateToken, (req, res) => {
    db.all('SELECT * FROM analysis_history WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch analysis history' });

        const history = rows.map(row => ({
            id: row.id,
            summary: row.summary,
            benefits: JSON.parse(row.benefits || '[]'),
            synergies: JSON.parse(row.synergies || '[]'),
            potential_risks: JSON.parse(row.potential_risks || '[]'),
            supplements_snapshot: JSON.parse(row.supplements_snapshot || '[]'),
            created_at: row.created_at
        }));
        res.json(history);
    });
});

// Delete Analysis
app.delete('/api/ai/analysis-history/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM analysis_history WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to delete analysis' });
        if (this.changes === 0) return res.status(404).json({ error: 'Analysis not found or unauthorized' });
        res.json({ message: 'Deleted' });
    });
});

// Chat Sessions Endpoints

// Get all chat sessions
app.get('/api/ai/sessions', authenticateToken, (req, res) => {
    db.all('SELECT * FROM chat_sessions WHERE user_id = ? AND is_archived = 0 ORDER BY updated_at DESC',
        [req.user.id], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
            res.json(rows || []);
        });
});

// Create new chat session
app.post('/api/ai/sessions', authenticateToken, (req, res) => {
    const { title } = req.body;
    const sessionTitle = title || 'New Chat';

    db.run('INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
        [req.user.id, sessionTitle], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to create session' });
            res.json({ id: this.lastID, title: sessionTitle, created_at: new Date().toISOString() });
        });
});

// Rename chat session
app.patch('/api/ai/sessions/:id', authenticateToken, (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    db.run('UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [title, req.params.id, req.user.id], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to update session' });
            if (this.changes === 0) return res.status(404).json({ error: 'Session not found or unauthorized' });
            res.json({ message: 'Session updated' });
        });
});

// Delete chat session (soft delete via archive or hard delete)
// For now, implementing hard delete to keep it simple as per request
app.delete('/api/ai/sessions/:id', authenticateToken, (req, res) => {
    // Due to CASCADE delete on foreign key, this will also delete messages
    db.run('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to delete session' });
            if (this.changes === 0) return res.status(404).json({ error: 'Session not found or unauthorized' });
            res.json({ message: 'Session deleted' });
        });
});

// AI Chat Endpoints

// AI Chat Endpoints

// Chat with AI about supplements
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
    const { message, model, sessionId } = req.body; // sessionId is optional (for now, but should be passed)
    const provider = await getAIProvider();

    if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const available = await provider.isAvailable();
        if (!available) {
            const errorMsg = provider.type === 'ollama'
                ? 'Ollama is not reachable. Make sure Ollama is running.'
                : 'AI not configured. Please set OPENROUTER_API_KEY in .env.';
            console.warn(`[AI Chat] Provider unavailability: ${errorMsg}`);
            return res.status(500).json({ error: errorMsg });
        }

        console.log(`[AI Chat] Using provider: ${provider.type}`);
        console.log(`[AI Chat] Requested model: ${model}`);
        console.log(`[AI Chat] Session ID: ${sessionId}`);

        // Fetch user's current supplements for context
        const supplements = await new Promise((resolve, reject) => {
            db.all('SELECT name, dosage, schedule_am, schedule_pm, reason FROM supplements WHERE user_id = ? AND archived = 0',
                [req.user.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
        });

        // Determine effective Session ID
        let effectiveSessionId = sessionId;

        // If no session ID, create one (or use most recent? Better to create new if explicit "new chat" wasn't handled by frontend)
        // However, frontend should handle session creation. 
        // If effectiveSessionId is missing, we must fail or auto-create.
        // Let's auto-create if missing to be robust
        if (!effectiveSessionId) {
            effectiveSessionId = await new Promise((resolve, reject) => {
                db.run('INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
                    [req.user.id, message.substring(0, 30) + '...'], function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
            });
        }

        // Fetch recent chat history for context (scoped to session)
        const chatHistory = await new Promise((resolve, reject) => {
            db.all('SELECT role, content FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT 10',
                [req.user.id, effectiveSessionId], (err, rows) => {
                    if (err) reject(err);
                    else resolve((rows || []).reverse());
                });
        });

        // Build supplement context
        let supplementContext = '';
        if (supplements.length > 0) {
            supplementContext = `\n\nThe user's current supplement stack:\n${supplements.map(s => {
                const schedule = [];
                if (s.schedule_am) schedule.push('morning');
                if (s.schedule_pm) schedule.push('evening');
                return `- ${s.name}${s.dosage ? ` (${s.dosage})` : ''}${schedule.length ? ` - taken ${schedule.join(' and ')}` : ''}${s.reason ? ` - reason: ${s.reason}` : ''}`;
            }).join('\n')}`;
        } else {
            supplementContext = '\n\nThe user currently has no supplements in their stack.';
        }

        const systemPrompt = `You are a knowledgeable supplement and health assistant for OptiStack, a supplement management application. 
Your role is to help users:
1. Understand their current supplement stack and potential interactions
2. Evaluate whether adding new supplements would be beneficial or pose risks
3. Provide recommendations for supplements based on health goals or ailments
4. Explain optimal timing, dosages, and synergies between supplements

Important guidelines:
- Always consider the user's current stack when making recommendations
- Highlight potential interactions (both positive synergies and negative interactions)
- Be clear when something requires medical consultation
- Provide evidence-based information when possible
- Be concise but thorough in your responses
${supplementContext}`;

        // Build messages array with history
        const messages = [
            { role: 'system', content: systemPrompt },
            ...chatHistory.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message }
        ];

        const result = await provider.chat(model, messages);
        const assistantMessage = result.content;

        console.log(`[AI Chat] Successful response from ${provider.type}`);

        // Track AI usage for cost estimation
        saveAIUsage(req.user.id, provider.type, result.model || model, result.usage, 'chat');

        // Save both messages to chat history
        db.run('INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
            [req.user.id, effectiveSessionId, 'user', message]);
        db.run('INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
            [req.user.id, effectiveSessionId, 'assistant', assistantMessage]);

        // Smart Title Generation: Update session title if it's the first message or generic "New Chat"
        // For simplicity, if history was empty before this, update title
        if (chatHistory.length === 0) {
            // Generate a short title from the first query (simple truncation for now, could use AI)
            const newTitle = message.substring(0, 40) + (message.length > 40 ? '...' : '');
            db.run('UPDATE chat_sessions SET title = ? WHERE id = ?', [newTitle, effectiveSessionId]);
        }

        // Update session timestamp
        db.run('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [effectiveSessionId]);

        res.json({ message: assistantMessage, sessionId: effectiveSessionId });

    } catch (error) {
        console.error('AI Chat Error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Chat request failed: ' + error.message });
    }
});

// Get Chat History (scoped to session)
app.get('/api/ai/chat-history', authenticateToken, (req, res) => {
    const sessionId = req.query.sessionId; // Optional filter

    let query = 'SELECT id, role, content, created_at FROM chat_history WHERE user_id = ?';
    let params = [req.user.id];

    if (sessionId) {
        query += ' AND session_id = ?';
        params.push(sessionId);
    } else {
        // If no session ID provided, maybe return nothing or all?
        // Returning all mixed together is confusing. 
        // Let's default to returning nothing if no session specified to force frontend to pick one
        // OR return the most recent session's data if just opened? 
        // For now, let's return messages with NULL session_id as "legacy" or return empty if stricter.
        // Let's support legacy fetch for backward compatibility if needed, but optimally we want strict session.
        // Actually, let's just return empty [] if no session specified as logic has changed.
        // query += ' AND session_id IS NULL'; 
    }

    query += ' ORDER BY created_at ASC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch chat history' });
        res.json(rows || []);
    });
});

// Clear Chat History (Session specific or all?)
// Renaming to DELETE session
// Keeping legacy endpoint but making it clear distinct session or all
app.delete('/api/ai/chat-history', authenticateToken, (req, res) => {
    const sessionId = req.query.sessionId;

    if (sessionId) {
        // Clear specific session history
        db.run('DELETE FROM chat_history WHERE user_id = ? AND session_id = ?', [req.user.id, sessionId], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to clear chat history' });
            res.json({ message: 'Session chat history cleared' });
        });
    } else {
        // Clear ALL history (Dangerous? acts as "Delete All Data")
        db.run('DELETE FROM chat_history WHERE user_id = ?', [req.user.id], function (err) {
            if (err) return res.status(500).json({ error: 'Failed to clear chat history' });
            res.json({ message: 'All chat history cleared' });
        });
    }
});

// Stack Sharing Endpoints

// Generate unique share code
const generateShareCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Create shareable stack link
app.post('/api/stacks/share', authenticateToken, async (req, res) => {
    const { title, description } = req.body;

    try {
        // Get user's current supplements
        const supplements = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM supplements WHERE user_id = ? AND archived = 0', [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        if (supplements.length === 0) {
            return res.status(400).json({ error: 'No active supplements to share' });
        }

        // Format supplements for snapshot
        const snapshot = supplements.map(s => ({
            name: s.name,
            dosage: s.dosage,
            unitType: s.unit_type || 'pills',
            schedule: {
                am: !!s.schedule_am,
                pm: !!s.schedule_pm,
                amPills: s.schedule_am_pills,
                pmPills: s.schedule_pm_pills
            },
            reason: s.reason
        }));

        const shareCode = generateShareCode();

        db.run(`INSERT INTO shared_stacks (user_id, share_code, title, description, supplements_snapshot) 
                VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, shareCode, title || 'My Supplement Stack', description || '', JSON.stringify(snapshot)],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint')) {
                        // Retry with new code
                        return res.status(500).json({ error: 'Please try again' });
                    }
                    return res.status(500).json({ error: 'Failed to create share link' });
                }
                res.json({
                    shareCode,
                    shareUrl: `/shared/${shareCode}`,
                    supplementCount: snapshot.length
                });
            }
        );
    } catch (error) {
        console.error('Share stack error:', error);
        res.status(500).json({ error: 'Failed to share stack' });
    }
});

// Get shared stack (PUBLIC - no auth required)
app.get('/api/stacks/shared/:code', (req, res) => {
    const { code } = req.params;

    db.get(`SELECT ss.*, u.username 
            FROM shared_stacks ss 
            LEFT JOIN users u ON ss.user_id = u.id 
            WHERE ss.share_code = ? AND ss.is_public = 1`,
        [code],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!row) return res.status(404).json({ error: 'Stack not found or expired' });

            // Check expiration
            if (row.expires_at && new Date(row.expires_at) < new Date()) {
                return res.status(404).json({ error: 'This shared stack has expired' });
            }

            // Increment view count
            db.run('UPDATE shared_stacks SET view_count = view_count + 1 WHERE id = ?', [row.id]);

            res.json({
                title: row.title,
                description: row.description,
                author: row.username || 'Anonymous',
                supplements: JSON.parse(row.supplements_snapshot).map(s => ({
                    ...s,
                    cycle: s.cycle || { onDays: null, offDays: null, startDate: null }
                })),
                viewCount: row.view_count + 1,
                createdAt: row.created_at
            });
        }
    );
});

// Import shared stack to user's account
app.post('/api/stacks/shared/:code/import', authenticateToken, async (req, res) => {
    const { code } = req.params;

    try {
        // Get the shared stack
        const sharedStack = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM shared_stacks WHERE share_code = ? AND is_public = 1', [code], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!sharedStack) {
            return res.status(404).json({ error: 'Stack not found' });
        }

        const supplements = JSON.parse(sharedStack.supplements_snapshot);
        let importedCount = 0;

        // Import each supplement
        for (const s of supplements) {
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO supplements (
                    user_id, name, dosage, unit_type,
                    schedule_am, schedule_pm, schedule_am_pills, schedule_pm_pills,
                    reason, archived
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`, [
                    req.user.id,
                    s.name,
                    s.dosage,
                    s.unitType || 'pills',
                    s.schedule?.am ? 1 : 0,
                    s.schedule?.pm ? 1 : 0,
                    s.schedule?.amPills || 1,
                    s.schedule?.pmPills || 1,
                    s.reason || `Imported from "${sharedStack.title}"`
                ], function (err) {
                    if (err) reject(err);
                    else {
                        importedCount++;
                        resolve();
                    }
                });
            });
        }

        res.json({
            message: `Successfully imported ${importedCount} supplements`,
            importedCount
        });

    } catch (error) {
        console.error('Import stack error:', error);
        res.status(500).json({ error: 'Failed to import stack' });
    }
});

// Get user's shared stacks
app.get('/api/stacks/my-shares', authenticateToken, (req, res) => {
    db.all('SELECT id, share_code, title, description, view_count, created_at FROM shared_stacks WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(rows || []);
        }
    );
});

// Delete shared stack
app.delete('/api/stacks/shared/:code', authenticateToken, (req, res) => {
    db.run('DELETE FROM shared_stacks WHERE share_code = ? AND user_id = ?',
        [req.params.code, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (this.changes === 0) return res.status(404).json({ error: 'Stack not found or unauthorized' });
            res.json({ message: 'Share link deleted' });
        }
    );
});

// Scrape Endpoint
app.get('/api/scrape', authenticateToken, async (req, res) => {
    let { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Normalize URL: add https:// if missing protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    let page = null;
    try {
        console.log(`Starting scrape for: ${url}`);

        // Use pooled browser instance
        const browser = await getBrowser();
        page = await browser.newPage();

        // Page already created above with pooled browser

        // Set User Agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Optimize: block images/css to speed up
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for product title
        await page.waitForSelector('#productTitle', { timeout: 10000 });

        const data = await page.evaluate(() => {
            const title = document.querySelector('#productTitle')?.innerText.trim();

            // Price: try multiple selectors
            let priceText = document.querySelector('.a-price .a-offscreen')?.innerText.trim() ||
                document.querySelector('.a-price .a-price-whole')?.innerText.trim();

            let price = '0.00';
            if (priceText) {
                const match = priceText.match(/[\d,.]+/);
                if (match) {
                    price = match[0].replace(/,/g, '');
                }
            }

            return { title, price };
        });

        const { title, price } = data;

        // Extract Dosage Strategy (Regex search in title)
        let dosage = '';
        const dosageRegex = /(\d+\s*(?:mg|g|mcg|IU|ml))/i;
        const dosageMatch = title.match(dosageRegex);
        if (dosageMatch) {
            dosage = dosageMatch[0];
        }

        // Initialize quantity
        let quantity = null;

        // Extract Unit Type Strategy
        let unitType = 'pills'; // default
        const weightRegex = /(\d+)\s*(?:g|grams)\b/i; // Detect grams
        const liquidRegex = /(\d+)\s*(?:ml|milliliters)\b/i; // Detect ml
        const powderRegex = /(?:powder|bulk)/i;

        if (weightRegex.test(title) || (powderRegex.test(title) && !/capsules|softgels|tablets|pills/i.test(title))) {
            unitType = 'grams';
            // Try to set quantity from weight if not set by count
            const weightMatch = title.match(weightRegex);
            if (weightMatch && !quantity) {
                quantity = parseInt(weightMatch[1], 10);
            }
        } else if (liquidRegex.test(title)) {
            unitType = 'ml';
            const liquidMatch = title.match(liquidRegex);
            if (liquidMatch && !quantity) {
                quantity = parseInt(liquidMatch[1], 10);
            }
        }

        // Extract Quantity/Count Strategy
        // Look for patterns like "120 Count", "90 Capsules", "60 Softgels"
        const quantityRegex = /(\d+)\s*(?:Count|Capsules|Softgels|Tablets|Veggie\s*Caps|Gummies|Servings)/i;
        const quantityMatch = title.match(quantityRegex);
        if (quantityMatch && !quantity) {
            quantity = parseInt(quantityMatch[1], 10);
        }

        if (!title) {
            throw new Error('Could not parse product page');
        }

        res.json({
            name: title,
            price: price,
            dosage: dosage,
            quantity: quantity,
            unitType: unitType
        });

    } catch (error) {
        console.error('Scraper Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch product details. Amazon may be blocking requests.' });
    } finally {
        if (page) await page.close();
    }
});

// Supplement Routes

// Get all supplements
app.get('/api/supplements', authenticateToken, (req, res) => {
    db.all('SELECT * FROM supplements WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const supplements = rows.map(s => ({
            id: s.id,
            name: s.name,
            shortName: s.short_name,
            link: s.link,
            price: s.price,
            price: s.price,
            quantity: s.quantity,
            unitType: s.unit_type || 'pills',
            dosage: s.dosage,
            schedule: {
                am: !!s.schedule_am,
                pm: !!s.schedule_pm,
                amPills: s.schedule_am_pills,
                pmPills: s.schedule_pm_pills
            },
            reason: s.reason,
            aiAnalysis: s.ai_analysis,
            recommendedDosage: s.recommended_dosage,
            sideEffects: s.side_effects,
            recommendedDosage: s.recommended_dosage,
            sideEffects: s.side_effects,
            rating: s.rating,
            archived: !!s.archived,
            cycle: {
                onDays: s.cycle_on_days,
                offDays: s.cycle_off_days,
                startDate: s.cycle_start_date
            },
            timing: {
                type: s.timing_type || 'fixed', // 'fixed', 'relative_wake', 'relative_sleep'
                offsetMinutes: s.timing_offset_minutes || 0
            }
        }));
        res.json(supplements);
    });
});

// Add supplement
app.post('/api/supplements', authenticateToken, (req, res) => {
    const s = req.body;
    db.run(`INSERT INTO supplements (
        user_id, name, short_name, link, price, quantity, dosage, unit_type,
        schedule_am, schedule_pm, schedule_am_pills, schedule_pm_pills,
        schedule_am, schedule_pm, schedule_am_pills, schedule_pm_pills,
        reason, ai_analysis, recommended_dosage, side_effects, rating, archived,
        cycle_on_days, cycle_off_days, cycle_start_date,
        timing_type, timing_offset_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        req.user.id, s.name, s.shortName, s.link, s.price, s.quantity, s.dosage, s.unitType || 'pills',
        s.schedule?.am ? 1 : 0, s.schedule?.pm ? 1 : 0, s.schedule?.amPills || 1, s.schedule?.pmPills || 1,
        s.reason, s.aiAnalysis, s.recommendedDosage, s.sideEffects, s.rating, 0,
        s.reason, s.aiAnalysis, s.recommendedDosage, s.sideEffects, s.rating, 0,
        s.cycle?.onDays || null, s.cycle?.offDays || null, s.cycle?.startDate || null,
        s.timing?.type || 'fixed', s.timing?.offsetMinutes || 0
    ], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...s });
    });
});

// Update supplement
app.put('/api/supplements/:id', authenticateToken, (req, res) => {
    const s = req.body;
    const id = req.params.id;
    db.run(`UPDATE supplements SET 
        name = ?, short_name = ?, link = ?, price = ?, quantity = ?, dosage = ?, unit_type = ?,
        schedule_am = ?, schedule_pm = ?, schedule_am_pills = ?, schedule_pm_pills = ?,
        reason = ?, ai_analysis = ?, recommended_dosage = ?, side_effects = ?, rating = ?, archived = ?,
        cycle_on_days = ?, cycle_off_days = ?, cycle_start_date = ?,
        timing_type = ?, timing_offset_minutes = ?
        WHERE id = ? AND user_id = ?`, [
        s.name, s.shortName, s.link, s.price, s.quantity, s.dosage, s.unitType || 'pills',
        s.schedule?.am ? 1 : 0, s.schedule?.pm ? 1 : 0, s.schedule?.amPills || 1, s.schedule?.pmPills || 1,
        s.reason, s.aiAnalysis, s.recommendedDosage, s.sideEffects, s.rating, s.archived ? 1 : 0,
        s.cycle?.onDays || null, s.cycle?.offDays || null, s.cycle?.startDate || null,
        s.timing?.type || 'fixed', s.timing?.offsetMinutes || 0,
        id, req.user.id
    ], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Supplement not found or unauthorized' });
        res.json({ id, ...s });
    });
});

// Delete supplement
app.delete('/api/supplements/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM supplements WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Supplement not found or unauthorized' });
        res.json({ message: 'Deleted' });
    });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (DISABLE_AUTH) {
        console.log('WARNING: Authentication is DISABLED. Running in single-user admin mode.');
    }
});
