// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'links.json');

// --- Middleware ---
// To parse JSON bodies from POST requests
app.use(express.json());
// To serve the static frontend files from the 'public' directory
app.use(express.static('public'));


// --- Data Persistence ---
// A function to load links from our JSON file into memory
const loadLinks = () => {
    try {
        // If the file exists, read it and parse it
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE);
            return JSON.parse(data);
        }
    } catch (error) {
        // If there's an error reading/parsing, log it and return an empty array
        console.error("Error loading links from file:", error);
    }
    // If file doesn't exist or was empty/corrupt, start with an empty array
    return [];
};

// A function to save the current links array back to the file
const saveLinks = (links) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(links, null, 2));
    } catch (error) {
        console.error("Error saving links to file:", error);
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
    const { url } = req.body;

    // Basic validation
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: 'Invalid URL provided.' });
    }

    const newLink = {
        id: Date.now(), // Simple unique ID
        url: url,
        createdAt: new Date().toISOString()
    };

    // Add to the start of the array so new links appear first
    links.unshift(newLink); 
    
    // Save the updated array to the file
    saveLinks(links);

    // Respond with the newly created link
    res.status(201).json(newLink);
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`✨ Server is running beautifully on http://localhost:${PORT}`);
    console.log(`📂 Links are stored in: ${DB_FILE}`);
});