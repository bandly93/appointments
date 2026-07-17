import { type Request, type Response, Router } from 'express'

const router = Router()

router.get('/login', (req, res) => {
  res.json({
    message: 'test login'
  })
})

export default router