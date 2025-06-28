// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'links.json');

// --- Middleware ---
// Increase the body limit to allow for Base64 image strings
app.use(express.json({ limit: '5mb' }));
app.use(express.static('public'));

// --- Data Persistence ---

/**
 * Loads links from links.json. This version is more robust.
 */
const loadLinks = () => {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            // If the file is empty, return an empty array to prevent a JSON parsing error.
            if (data.trim() === '') {
                console.log('links.json is empty, starting with a new list.');
                return [];
            }
            const parsedData = JSON.parse(data);
            console.log(`✅ Successfully loaded ${parsedData.length} link(s) from links.json`);
            return parsedData;
        }
    } catch (error) {
        console.error("❌ Error loading or parsing links.json:", error);
    }
    // If the file doesn't exist or an error occurred, start with an empty array.
    return [];
};

/**
 * Saves the current links array to links.json.
 */
const saveLinks = (links) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(links, null, 2));
    } catch (error) {
        console.error("❌ Error saving links to file:", error);
    }
};

// Load links into memory when the server starts
let links = loadLinks();

// --- API Endpoints ---

// GET /api/links - Retrieve all links
app.get('/api/links', (req, res) => {
    res.json(links);
});

// POST /api/links - Add a new link
app.post('/api/links', (req, res) => {
    // We now expect 'name', 'url', and the 'pfp' (profile picture)
    const { name, url, pfp } = req.body;

    // Basic validation
    if (!name || !url) {
        return res.status(400).json({ message: 'Name and URL are required.' });
    }

    const newLink = {
        id: Date.now(),
        name: name,
        url: url,
        pfp: pfp, // Save the profile picture data with the link
        createdAt: new Date().toISOString()
    };

    links.unshift(newLink);
    saveLinks(links);

    console.log(`🔗 New link added: "${name}"`);
    res.status(201).json(newLink);
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`✨ Server is running beautifully on http://localhost:${PORT}`);
    console.log(`📂 Links are stored in: ${DB_FILE}`);
});
