import next from 'next';
import express from 'express';
import path from 'path';
import routes from './routes';

require('dotenv').config();

const port = parseInt(process.env.PORT || '8081', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handler = routes.getRequestHandler(app, ({
  req, res, route, query
}) => {
  if (route.name === 'model') {
    // eslint-disable-next-line no-param-reassign
    route.page = '/model/profile';
  } else if (route.name === 'i18n-dashboard') {
    // eslint-disable-next-line no-param-reassign
    route.page = '/';
  }
  app.render(req, res, route.page, query);
});

app.prepare().then(() => {
  const expressApp = express();
  expressApp.use('/static', express.static('../static'));

  expressApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../static/landing-page/demo2/index.html'));
  });

  expressApp.get('/became-a-models', (req, res) => {
    res.sendFile(path.join(__dirname, '../static/landing-page/demo4/index.html'));
  });

  expressApp.use(handler).listen(port);
  // eslint-disable-next-line no-console
  console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
})
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.log('Something went wrong: ', e);
    process.exit();
  });
