require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '8426',
    database: process.env.DB_DATABASE || 'frontpage_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0 
});

const initializeDatabase = async () => {
    const connection = await pool.promise().getConnection();

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_DATABASE}\`;`);
        console.log(`Database '${process.env.DB_DATABASE}' ensured.`);

        // Use the database
        await connection.query(`USE \`${process.env.DB_DATABASE}\`;`);

        // Check if the table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'hacker_news';");

        if (tables.length > 0) {
            // Truncate function of hacker_news table so that all the entries are cleared. 
            await connection.query("TRUNCATE TABLE hacker_news;");
            // console.log('Table `hacker_news` cleared and ID reset to 1 and incrementing.');
        } else {
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS hacker_news (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255),
                    url VARCHAR(255),
                    author VARCHAR(100),
                    points VARCHAR(50),
                    comments VARCHAR(50),
                    description TEXT,
                    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_url (url),
                    published_stories_count INT
                );
            `;
            await connection.query(createTableQuery);
            console.log('Table `hacker_news` ensured.');
        }
    } catch (err) {
        console.error('Error initializing database:', err.message);
    } finally {
        connection.release(); // Release the connection back to the pool
    }
};

// Initialize the database on startup
initializeDatabase();

module.exports = pool;
