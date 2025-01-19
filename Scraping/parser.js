// This file parses additional details for each story from its URL.
const axios = require('axios');
const cheerio = require('cheerio');

const parseStoryDetails = async (url) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const description = $('meta[name="description"]').attr('content') || 'No description available.';
        return { description };
    } catch (err) {
        console.error(`Error fetching story details from ${url}:`, err.message);
        return { description: 'Failed to fetch description.' };
    }
};

module.exports = { parseStoryDetails };
