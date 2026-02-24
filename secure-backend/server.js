const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet'); // Helps secure Express apps with various HTTP headers
const { apiRateLimiter } = require('./middleware/security');
const attendanceRoutes = require('./routes/attendanceRoutes');

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

// 5. Cross-Origin Resource Sharing (Optional: restrict to your specific frontend URL)
app.use(cors({
    origin: '*', // For production, replace '*' with your frontend URL like 'https://my-attendance-app.vercel.app'
    methods: ['POST', 'GET']
}));

// Routes
app.use('/api/v1/attendance', attendanceRoutes);

// Unhandled Route Handler
app.all('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this secure server.`
    });
});

// Database connection & Server initialization
const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_secure';

mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB Secure Connection Successful');
    app.listen(PORT, () => {
        console.log(`Secure server running on port ${PORT}...`);
    });
}).catch(err => {
    console.error('Database connection error:', err);
});
