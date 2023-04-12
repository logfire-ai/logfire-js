/**
 * This project showcases Logfire JavaScript integration for
 * both backend and frontend code
 *
 * This code uses the @logfire/js package which can be used for both frontend and backend
 *
 * For more infromation visit https://github.com/logfire/logfire-js
 */

// Require Logfire Class for backend code (Node.js)
const { Node: Logfire } = require('@logfire/js');

// In frontend code use the following:
// import { Browser as Logfire } from "@logfire/js";

// Create a logger from a Logfire class
const logger = new Logfire('7b8f60bffe594dc597599138e275ef4e', process.argv[2]);

// Usage

// Send debug level log using the debug() method
logger.debug('I am using Logfire!');

// Send info level log using the info() method
logger.info('An interesting event occured!');

// Send warn level log using the warn() method
// You can add additional structured data to help you troubleshoot your code as shown below
logger.warn('Something is not quite right, better check on it.', {
  user: {
    username: 'someuser',
    email: 'someuser@example.com',
  },
  additional_info: {
    tried_accessing: '/url/of/error',
  },
});

// Send error level log using the error() method
logger.error('Oops! An runtime ERROR occurred!').then(
  // Logging methods are async function returning Promises
  // OnResolve write message
  function() {
    console.log('All done! You can check your logs now.');
  }
);
