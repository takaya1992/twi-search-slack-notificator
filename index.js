'use strict';

const AWS = require('aws-sdk');
const Twitter = require('twitter');
const leftPad = require('left-pad');
const { IncomingWebhook } = require('@slack/client');

// Replace it with the word you want to search!!
// c.f. https://developer.twitter.com/en/docs/tweets/search/guides/standard-operators.html
const TWITTER_SEARCH_QUERY = '"takaya1992" lang:ja exclude:retweets';
const TWITTER_SEARCH_COUNT = 200;
const CURRENT_MAX_TWEET_ID_KEY = 'current_max_tweet_id';

AWS.config.region = process.env.AWS_REGION;

const getCurrentMaxTweetId = () => {
  const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  return s3.getObject({
    Bucket: process.env.S3_BUCKET,
    Key: CURRENT_MAX_TWEET_ID_KEY
  }).promise().then(data => {
    return data.Body.toString();
  });
};

const setCurrentMaxTweetId = currentMaxTweetId => {
  const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  return s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: CURRENT_MAX_TWEET_ID_KEY,
    ContentType: 'text/plain',
    Body: currentMaxTweetId
  }).promise();
};

const sortById = (a, b) => {
  return (leftPad(a.id_str, 20, '0') < leftPad(b.id_str, 20, '0')) ? -1 : 1;
};

const generateTweetUrl = tweet => {
  return 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str
};

exports.handler = (event, context, callback) => {
  let currentMaxTweetId, maxTweetId;

  getCurrentMaxTweetId().then(result => {
    currentMaxTweetId = result;

    const twitterClient = new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    return twitterClient.get(
      'search/tweets',
      {
        q: TWITTER_SEARCH_QUERY,
        since_id: currentMaxTweetId,
        count: TWITTER_SEARCH_COUNT
      }
    );
  }).then(result => {
    const tweets = result.statuses.sort(sortById);
    maxTweetId = (tweets.length > 0) ? tweets[tweets.length - 1].id_str : currentMaxTweetId;

    const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
    const promises = tweets.map(tweet => {
      return webhook.send(generateTweetUrl(tweet));
    });
    return Promise.all(promises);
  }).then(result => {
    return setCurrentMaxTweetId(maxTweetId);
  }).then(result => {
    context.done();
  }).catch(error => {
    console.error(error);
    context.fail(error);
  });
};
