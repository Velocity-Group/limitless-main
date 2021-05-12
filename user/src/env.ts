export default {
  apiEndpoint: 'https://fanso-api.xscripts.info',
  socketEndpoint: 'https://fanso-api.xscripts.info',
  // apiEndpoint: 'http://localhost:9000',
  // socketEndpoint: 'http://localhost:9000',
  debug: process.env.NODE_ENV === 'development',
  maxVideoBitrateKbps: 900
};
