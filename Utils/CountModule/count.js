const db = require('../../DataBase/dbConfig');
const { server_start_time } = require('../TimeModule/time');

// Function to calculate and update the published stories count
const updatePublishedStoriesCount = async () => {
    try {
        // Calculating the time range
        const serverStartTime = new Date(server_start_time);
        const fiveMinutesBefore = new Date(serverStartTime.getTime() - 5 * 60 * 1000);

        // Querying to count the number of stories in the time range
        const countQuery = `
            SELECT COUNT(*) AS storyCount 
            FROM hacker_news 
            WHERE time BETWEEN ? AND ?
        `;

        const [rows] = await db.promise().query(countQuery, [fiveMinutesBefore, serverStartTime]);
        const storyCount = rows[0].storyCount;

        // Updating the published_stories_count column
        const updateQuery = `
            UPDATE hacker_news 
            SET published_stories_count = ?
        `;
        await db.promise().query(updateQuery, [storyCount]);
        console.log(`Published stories count updated: ${storyCount}`);
    } catch (error) {
        console.error('Error updating published stories count:', error.message);
    }
};

module.exports = { updatePublishedStoriesCount };