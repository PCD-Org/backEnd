const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');
const config = require('./config/env');

let server;
let isShuttingDown = false;

const gracefulShutdown = (exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down gracefully...');

  const performDisconnect = async () => {
    try {
      await disconnectDB();
      process.exit(exitCode);
    } catch (err) {
      process.exit(1);
    }
  };

  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      performDisconnect();
    });
  } else {
    performDisconnect();
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  gracefulShutdown(1);
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP server
    server = app.listen(config.port, () => {
      console.log(`Server running in ${config.env} mode on port ${config.port} ⚡`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  gracefulShutdown(1);
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED.');
  gracefulShutdown(0);
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('👋 SIGINT RECEIVED.');
  gracefulShutdown(0);
});
