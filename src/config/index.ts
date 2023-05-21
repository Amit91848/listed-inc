import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri: process.env.REDIRECT_URI,
  mongo_uri: process.env.MONGO_URI,
};
