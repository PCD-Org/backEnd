const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  const conn = await mongoose.connect(config.mongoose.url);
  console.log(`MongoDB Connected succesfuly 💥⚡`);
  return conn;
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };
