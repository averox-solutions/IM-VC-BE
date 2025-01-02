const fs = require('fs');
const path = require('path');

// Function to log errors to a CSV file with timestamp
const errorLogger = (error) => {
    const errorDetails = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
    };
    
    const logLine = `${errorDetails.timestamp},${errorDetails.message},${errorDetails.stack.replace(/[\r\n]+/g, ' ')}\n`;
    
    const logFilePath = path.join(__dirname, 'error_log.csv');

    // Append to the CSV file
    fs.appendFile(logFilePath, logLine, (err) => {
        if (err) {
            console.error('Failed to log error:', err);
        }
    });
};

module.exports = errorLogger;