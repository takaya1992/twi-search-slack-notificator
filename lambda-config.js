module.exports = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  handler: 'index.handler',
  role: '<role arn>',
  functionName: '<function name>',
  timeout: 10
}
