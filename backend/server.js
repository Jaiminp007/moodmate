const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/moodmate', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    subscription: { type: String, default: 'free' },
    subscriptionId: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                subscription: user.subscription
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                subscription: user.subscription
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

app.post('/api/subscription/verify', authenticateToken, async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan } = req.body;

        // Verify payment signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Update user subscription
        const user = await User.findById(req.user.id);
        user.subscription = plan;
        user.subscriptionId = razorpay_payment_id;
        await user.save();

        res.json({ message: 'Subscription updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying subscription' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 