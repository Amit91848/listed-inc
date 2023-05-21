import express, { urlencoded } from 'express';
import bodyParser from 'body-parser';
import config from './config';
import Logger from './loader/logger';
import authRouter from './router/auth.route';
import mongoose from 'mongoose';
import { startTask } from './controllers';

async function startServer() {
  const app = express();

  mongoose.set('strictQuery', false);
  mongoose
    .connect(config.mongo_uri!)
    .then(() => Logger.info('Database Connected'))
    .catch((err) => Logger.error({ err }));

  app.use(urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.use('/auth', authRouter);

  setInterval(async () => {
    await startTask();
  }, 120000);

  app
    .listen(config.port, () => {
      Logger.info(`
        ################################################
        Server listening : http://localhost:${config.port}/
        ################################################
      `);
    })
    .on('error', (err) => {
      Logger.error(err);
      process.exit(1);
    });
}

startServer();
