import express from 'express';
import passport from 'passport';
import { OAuthController } from '../auth/oauth.controller';
import { requireAuth, requireGuest } from '../middleware/auth.middleware';

const router = express.Router();
const oauthController = new OAuthController();

// OAuth login routes
router.get('/google', requireGuest, (req, res) => {
  oauthController.login(req, res, 'google');
});

router.get('/google/callback', requireGuest, (req, res) => {
  oauthController.callback(req, res, 'google');
});

router.get('/github', requireGuest, (req, res) => {
  oauthController.login(req, res, 'github');
});

router.get('/github/callback', requireGuest, (req, res) => {
  oauthController.callback(req, res, 'github');
});

router.get('/facebook', requireGuest, (req, res) => {
  oauthController.login(req, res, 'facebook');
});

router.get('/facebook/callback', requireGuest, (req, res) => {
  oauthController.callback(req, res, 'facebook');
});

// Logout route
router.post('/logout', requireAuth, (req, res) => {
  oauthController.logout(req, res);
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  oauthController.getCurrentUser(req, res);
});

export default router;