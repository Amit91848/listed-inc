import { oauthClient, redirectUrl } from '../config/google';
import { Request, Response } from 'express';
import { createUser, findByGoogleId, updateTokens } from './user.controller';
import { UserDoc } from '../schema/User';

export interface GoogleUserInfo {
  name: string;
  picture: string;
  sub: string;
  email: string;
}

/**
 * Redirects to Google Consent Page
 */
export const signInWithGoogle = (_: Request, res: Response) => {
  res.redirect(redirectUrl);
};

/**
 * Exchange authorization code for google token
 * @param req Express Request
 * @param res Express Response
 * @returns token and user info
 */
export const googleRedirect = async (req: Request, res: Response) => {
  const code = req.query.code;
  if (code) {
    const { tokens } = await oauthClient.getToken(code as string);
    oauthClient.setCredentials(tokens);
    const { access_token, refresh_token, expiry_date, id_token } = tokens;

    const { email, name, picture, sub: googleId } = await verifyIdToken(id_token as string);

    const user = await findByGoogleId(googleId);

    if (!user) {
      //@ts-expect-error
      await createUser({ access_token, refresh_token, name, email, picture, googleId, expiry_date });
    } else {
      //@ts-expect-error
      await updateTokens(access_token, refresh_token, user._id, expiry_date);
    }

    return res.json({ name, email, access_token });
  }
  return res.json('Authorization Code not present');
};

/**
 * Fetch user info for id_token
 * @param idToken JWT signed By Google
 * @returns User Info present in token
 */
async function verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  const json = await response.json();

  return json;
}

/**
 * Checks if access token is valid and refreshes it
 * @param user User Document
 * @returns access token
 */
export const checkAndRefreshAccessToken = async (user: UserDoc) => {
  const { expiry_date } = user;

  const currentTimestamp = Math.floor(Date.now());
  const tokenExpiryThreshold = 60000;

  if (expiry_date && currentTimestamp + tokenExpiryThreshold >= parseInt(expiry_date)) {
    oauthClient.setCredentials({ refresh_token: user.refresh_token });
    const refreshResponse = await oauthClient.refreshAccessToken();
    const refreshedTokens = refreshResponse.credentials;

    const { access_token, refresh_token, expiry_date: e_date } = refreshedTokens;
    console.log('new access token', access_token);

    //@ts-expect-error
    await updateTokens(access_token, refresh_token, user._id, e_date);
    return access_token as string;
  }
  return user.access_token;
};
