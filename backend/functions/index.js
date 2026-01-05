const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

exports.health = onRequest((req, res) => {
  logger.info('Health check', { structuredData: true });
  res.status(200).json({ ok: true, service: 'empylo-functions' });
});
