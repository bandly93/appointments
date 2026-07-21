import { Router } from 'express'
import { login, refresh, logout, me } from './auth.controller.js'
import { requireAuth } from './auth.middleware.js'

const router = Router()

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router