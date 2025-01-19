const axios = require('axios');
const cheerio = require('cheerio');
const { parseStoryDetails } = require('./parser');
const { server_start_time } = require('../Utils/TimeModule/time');


const processedStories = new Set();

// Function to convert "x minutes ago" to a timestamp
const calculateTimestamp = (minutesAgo) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - minutesAgo);
    return now.toISOString(); 
};

// Function to check if a story is within the last 5 minutes
const isRecentStory = (storyTime, serverStartTime) => {
    const storyDate = new Date(storyTime);
    const serverDate = new Date(serverStartTime);
    return storyDate >= serverDate;
};

// Function to fetch stories from Hacker News
const fetchHackerNewsStories = async () => {
    try {
        const response = await axios.get('https://news.ycombinator.com/newest');
        const $ = cheerio.load(response.data);
        const stories = [];

        $('.athing').each((index, element) => {
            const title = $(element).find('.titleline > a').text();
            let url = $(element).find('.titleline > a').attr('href');
            const detailsElement = $(element).next();
            const author = detailsElement.find('.hnuser').text();
            const points = detailsElement.find('.score').text();
            const comments = detailsElement.find('a:contains("comments")').text();
            const timeText = detailsElement.find('.age > a').text(); 
            const minutesAgoMatch = timeText.match(/(\d+)\sminutes?\sago/);
            const minutesAgo = minutesAgoMatch ? parseInt(minutesAgoMatch[1], 10) : null;

            // Handle relative URLs
            if (url && !url.startsWith('http')) {
                url = 'https://news.ycombinator.com/' + url;
            }

            if (title && url && minutesAgo !== null) {
                const storyTime = calculateTimestamp(minutesAgo);

                // Check if the story is within the last 5 minutes or after server start time
                // Also, check if the URL has already been processed (scrapped)
                if (isRecentStory(storyTime, server_start_time) && !processedStories.has(url)) {
                    stories.push({
                        title,
                        url,
                        author: author || 'Unknown',
                        points: points || '0 points',
                        comments: comments || '0 comments',
                        time: storyTime,
                    });

                    // Add the URL to the set of processed stories
                    processedStories.add(url);
                }
            }
        });

        // Parse additional details for each story
        for (const story of stories) {
            try {
                story.details = await parseStoryDetails(story.url);
            } catch (err) {
                console.error(`Error fetching details for ${story.url}: ${err.message}`);
                story.details = { description: 'Failed to fetch description.'};
            }
        }
        return stories;
    } catch (err) {
        console.error('Error fetching stories:', err.message);
        return [];
    }
};

module.exports = { fetchHackerNewsStories };