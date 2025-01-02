const redis = require('redis');

// const redisClient = process.env.NODE_ENV === 'production' ? redis.createClient({
//     url: "redis://redis:6379",
//     port: 6379
// }) : redis.createClient({
//     host: 'localhost',
//     port: 6379
// })



const redisClient = redis.createClient({
    url: process.env.NODE_ENV === 'localhost' ? "" : "redis://redis:6379",
    host: process.env.NODE_ENV === 'localhost' ? "localhost" : "",
    port: 6379
})


async function redisConnection() {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');

        await redisClient.flushDb();
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        throw error;
    }
}

module.exports = { redisClient, redisConnection };