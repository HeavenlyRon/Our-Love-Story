const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'HeavenlyRon';

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
    secret: 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(express.static('.'));

// Messages file path
const messagesFile = path.join(__dirname, 'messages.json');

// Initialize messages file if it doesn't exist
if (!fs.existsSync(messagesFile)) {
    fs.writeFileSync(messagesFile, JSON.stringify([], null, 2));
}

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// API endpoint to receive messages
app.post('/api/messages', (req, res) => {
    const { name, email, message } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        // Read existing messages
        const data = fs.readFileSync(messagesFile, 'utf8');
        const messages = JSON.parse(data);
        
        // Add new message with timestamp
        const newMessage = {
            id: Date.now(),
            name,
            email,
            message,
            timestamp: new Date().toISOString()
        };
        
        messages.push(newMessage);
        
        // Write updated messages back to file
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
        
        return res.status(200).json({ success: true, message: 'Message received!' });
    } catch (error) {
        console.error('Error saving message:', error);
        return res.status(500).json({ error: 'Failed to save message' });
    }
});

// API endpoint to get all messages (optional - for viewing messages)
app.get('/api/messages', (req, res) => {
    try {
        const data = fs.readFileSync(messagesFile, 'utf8');
        const messages = JSON.parse(data);
        return res.json(messages);
    } catch (error) {
        console.error('Error reading messages:', error);
        return res.status(500).json({ error: 'Failed to read messages' });
    }
});

// Admin Routes
// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Admin login
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }
    
    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        return res.status(200).json({ success: true, message: 'Logged in!' });
    } else {
        return res.status(401).json({ error: 'Invalid password' });
    }
});

// Check auth status
app.get('/admin/check-auth', (req, res) => {
    if (req.session.authenticated) {
        return res.json({ authenticated: true });
    }
    return res.json({ authenticated: false });
});

// Admin logout
app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    return res.json({ success: true });
});

// Get all messages (admin only)
app.get('/api/admin/messages', requireAuth, (req, res) => {
    try {
        const data = fs.readFileSync(messagesFile, 'utf8');
        const messages = JSON.parse(data);
        // Return in reverse order (newest first)
        return res.json(messages.reverse());
    } catch (error) {
        console.error('Error reading messages:', error);
        return res.status(500).json({ error: 'Failed to read messages' });
    }
});

// Delete message (admin only)
app.delete('/api/admin/messages/:id', requireAuth, (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        const data = fs.readFileSync(messagesFile, 'utf8');
        let messages = JSON.parse(data);
        
        // Find and remove the message
        const initialLength = messages.length;
        messages = messages.filter(m => m.id !== messageId);
        
        if (messages.length === initialLength) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        // Write updated messages back to file
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
        
        return res.status(200).json({ success: true, message: 'Message deleted!' });
    } catch (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Messages will be saved to ${messagesFile}`);
});
