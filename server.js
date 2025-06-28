// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'links.json');

// --- Middleware ---
app.use(express.json());
app.use(express.static('public'));

// --- Data Persistence ---
const loadLinks = () => {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE);
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error loading links from file:", error);
    }
    return [];
};

const saveLinks = (links) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(links, null, 2));
    } catch (error) {
        console.error("Error saving links to file:", error);
    }
};

let links = loadLinks();

// --- API Endpoints ---

// GET /api/links - Retrieve all links
app.get('/api/links', (req, res) => {
    res.json(links);
});

// POST /api/links - Add a new link
app.post('/api/links', (req, res) => {
    // We now expect 'name' and 'url' from the frontend
    const { name, url } = req.body;

    // Basic validation for both fields
    if (!name || typeof name !== 'string' || !url || typeof url !== 'string') {
        return res.status(400).json({ message: 'Invalid name or URL provided.' });
    }

    const newLink = {
        id: Date.now(),
        name: name, // Add the name
        url: url,
        createdAt: new Date().toISOString()
    };

    links.unshift(newLink);
    saveLinks(links);

    res.status(201).json(newLink);
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`✨ Server is running beautifully on http://localhost:${PORT}`);
    console.log(`📂 Links are stored in: ${DB_FILE}`);
});
