require('dotenv').config();

const event = {};
const context = {
  invokeid: 'invokeid',
  done: (err, message) => {
    return;
  }
};

const lambda = require('./index.js');
lambda.handler(event, context);

