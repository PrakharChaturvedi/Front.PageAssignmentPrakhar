const express = require('express');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const { fetchHackerNewsStories } = require('./Scraping/scraper');
const apiRoutes = require('./Backend/api');
const db = require('./DataBase/dbConfig');
const { server_start_time } = require('./Utils/TimeModule/time');
const { updatePublishedStoriesCount } = require('./Utils/CountModule/count');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use('/api', apiRoutes);

// Broadcast data to WebSocket clients
const broadcastToClients = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// Periodic Scraping and Broadcasting into the DB
const scrapeAndBroadcast = async () => {
    const stories = await fetchHackerNewsStories();
    if (stories.length > 0) {
        // Insert stories into the database
        stories.forEach((story) => {
            const query = `
                INSERT INTO hacker_news (title, url, author, points, comments, description)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE points = VALUES(points), comments = VALUES(comments), description = VALUES(description)
            `;
            const values = [story.title, story.url, story.author, story.points, story.comments, story.details.description];
            
            db.query(query, values, (err) => {
                if (err) {
                    console.error('Error inserting story:', err.message, { story });
                } else {
                    console.log('Story inserted successfully:', story.title);
                }
            }); 
        });
        // Broadcast new stories
        broadcastToClients({ type: 'new_stories', data: stories });
    }
};

// Scraping every 5 minutes
setInterval(scrapeAndBroadcast, 300000);

// For running the updatePublishedStoriesCount on loop of 5 mins, but as it's useless to run the thing on loop used a timeout on server.listen funciton. View line 78 index.js file
// setInterval(updatePublishedStoriesCount, 300000);

// WebSocket Connection
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.on('message', (message) => {
        console.log('Received message:', message);
    });
});

// Start Server
server.listen(port, () => {
    console.log('Server is running on http://localhost:${port}');
    console.log('Server started at:'+ server_start_time);
    
    // Runs only once after 5.1 mins of server starting point
    setTimeout(() => {
        updatePublishedStoriesCount();
    }, 5.1 * 60 * 1000); 
});