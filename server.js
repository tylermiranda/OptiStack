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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    process.exit(1);
}

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

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.error('FATAL: SESSION_SECRET environment variable is required');
    process.exit(1);
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
configurePassport();

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
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Auth Routes

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

// AI Status Endpoint - tells frontend if AI is available
app.get('/api/ai/status', (req, res) => {
    const isAvailable = !!process.env.OPENROUTER_API_KEY;
    res.json({ available: isAvailable });
});

// AI Proxy Endpoint (keeps API keys server-side)
app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
    const { prompt, model } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('AI Analysis request failed: OPENROUTER_API_KEY is not set in environment.');
        return res.status(500).json({ error: 'AI not configured. Please set OPENROUTER_API_KEY in .env.' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'OptiStack'
            },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
        });
        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter API Error:', data);
            return res.status(response.status).json({ error: data.error?.message || 'AI provider returned an error' });
        }

        res.json(data);
    } catch (error) {
        console.error('AI Proxy Error:', error.message);
        res.status(500).json({ error: 'AI request failed: ' + error.message });
    }
});

// Scrape Endpoint
app.get('/api/scrape', authenticateToken, async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
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

        // Extract Quantity/Count Strategy
        let quantity = null;
        // Look for patterns like "120 Count", "90 Capsules", "60 Softgels"
        const quantityRegex = /(\d+)\s*(?:Count|Capsules|Softgels|Tablets|Veggie\s*Caps|Gummies|Servings)/i;
        const quantityMatch = title.match(quantityRegex);
        if (quantityMatch) {
            quantity = parseInt(quantityMatch[1], 10);
        }

        if (!title) {
            throw new Error('Could not parse product page');
        }

        res.json({
            name: title,
            price: price,
            dosage: dosage,
            quantity: quantity
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
            quantity: s.quantity,
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
            rating: s.rating,
            archived: !!s.archived
        }));
        res.json(supplements);
    });
});

// Add supplement
app.post('/api/supplements', authenticateToken, (req, res) => {
    const s = req.body;
    db.run(`INSERT INTO supplements (
        user_id, name, short_name, link, price, quantity, dosage, 
        schedule_am, schedule_pm, schedule_am_pills, schedule_pm_pills,
        reason, ai_analysis, recommended_dosage, side_effects, rating, archived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        req.user.id, s.name, s.shortName, s.link, s.price, s.quantity, s.dosage,
        s.schedule?.am ? 1 : 0, s.schedule?.pm ? 1 : 0, s.schedule?.amPills || 1, s.schedule?.pmPills || 1,
        s.reason, s.aiAnalysis, s.recommendedDosage, s.sideEffects, s.rating, 0
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
        name = ?, short_name = ?, link = ?, price = ?, quantity = ?, dosage = ?, 
        schedule_am = ?, schedule_pm = ?, schedule_am_pills = ?, schedule_pm_pills = ?,
        reason = ?, ai_analysis = ?, recommended_dosage = ?, side_effects = ?, rating = ?, archived = ?
        WHERE id = ? AND user_id = ?`, [
        s.name, s.shortName, s.link, s.price, s.quantity, s.dosage,
        s.schedule?.am ? 1 : 0, s.schedule?.pm ? 1 : 0, s.schedule?.amPills || 1, s.schedule?.pmPills || 1,
        s.reason, s.aiAnalysis, s.recommendedDosage, s.sideEffects, s.rating, s.archived ? 1 : 0,
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
});
