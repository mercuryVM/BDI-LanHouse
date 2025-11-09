const router = require('express-promise-router')();
const loginControlller = require('../controllers/login.controller');

router.post('/login', loginControlller.login);
router.post('/logout', loginControlller.logout);

module.exports = router;