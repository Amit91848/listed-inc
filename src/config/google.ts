import { google } from 'googleapis';

import config from '.';

const gmailScope = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify',
  'profile',
  'email',
];

export const oauthClient = new google.auth.OAuth2({
  clientId: config.google_client_id,
  clientSecret: config.google_client_secret,
  redirectUri: config.redirect_uri,
});

export const redirectUrl = oauthClient.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: gmailScope,
});
