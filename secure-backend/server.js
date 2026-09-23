const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Helps secure Express apps with various HTTP headers
const { apiRateLimiter } = require('./middleware/security');
const attendanceRoutes = require('./routes/attendanceRoutes');

// Verify Supabase Config exists before starting
require('./config/supabaseClient');

const app = express();

// --- 4️⃣ BACKEND SECURITY & MIDDLEWARE (IMPORTANT) --- //

// 1. Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// This is MANDATORY for rate limiting to work with real client IPs, not proxy IPs
app.set('trust proxy', 1);

// 2. HTTP Security Headers
app.use(helmet());

// 3. Prevent API Abuse Globally (Postman / scripts)
app.use(apiRateLimiter);

// 4. Parse incoming JSON requests and limit size to prevent payload abuse
app.use(express.json({ limit: '10kb' }));

// 5. Cross-Origin Resource Sharing — configured via CORS_ORIGIN env var
// Set CORS_ORIGIN on Render to your Vercel URL (e.g. https://attendance-fawn-alpha.vercel.app)
// You can also set multiple origins separated by commas
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Routes
app.use('/api/v1/attendance', attendanceRoutes);

// Health check root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'AttendX Secure API is Live & Running!',
        version: '1.0.0'
    });
});

// Unhandled Route Handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this secure server.`
    });
});

// Server initialization (No MongoDB connection required anymore!)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Secure server running (Supabase Integration) on port ${PORT}...`);
    console.log(`Requires: SUPABASE_URL and SUPABASE_ANON_KEY in .env file`);
});


