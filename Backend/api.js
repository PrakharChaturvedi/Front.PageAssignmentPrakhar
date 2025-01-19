const express = require('express');
const db = require('../DataBase/dbConfig');

const router = express.Router();

// Fetch all stories
router.get('/stories', (req, res) => {
    const query = 'SELECT * FROM hacker_news ORDER BY time DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching stories:', err.message);
            return res.status(500).send('Error fetching stories');
        }
        res.json(results);
    });
});

module.exports = router;
