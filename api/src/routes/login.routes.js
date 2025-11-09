const router = require('express-promise-router')();
const loginControlller = require('../controllers/login.controller');
const {authMiddleware} = require('../middlewares/auth.middleware');

router.post('/login', loginControlller.login);
router.post('/logout', authMiddleware, loginControlller.logout);

module.exports = router;