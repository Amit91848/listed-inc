import * as authController from '../controllers/auth.controller';
import express from 'express';

const authRouter = express.Router();

// Redirect to Google Signin page
authRouter.get('/google', authController.signInWithGoogle);

// Perform Exchange
authRouter.get('/google/redirect', authController.googleRedirect);

export default authRouter;
