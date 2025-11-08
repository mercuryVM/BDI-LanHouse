const router = require('express-promise-router')();
const userControlller = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/user', authMiddleware,  userControlller.user);

module.exports = router;