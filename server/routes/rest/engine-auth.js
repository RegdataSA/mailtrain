'use strict'

const {tokenProvider} = require('../../lib/engine')

const passport = require('../../lib/passport')
const router = require('../../lib/router-async').create()

router.postAsync('/connect/token', passport.loggedIn, async (req, res) => {
  const tokenInfo = await tokenProvider.generateToken()

  return res.json(tokenInfo)
})

module.exports = router
