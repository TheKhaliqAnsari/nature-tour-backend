const router = require('express').Router()
const tourRoute = require('./tour.route')
const authRoute = require('./auth.route.js')
router.use('/tour', tourRoute)
router.use('/auth', authRoute);

module.exports = router;