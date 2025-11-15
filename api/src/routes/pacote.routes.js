const router = require('express-promise-router')();
const pacoteController = require('../controllers/pacote.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getMostBoughtPacotes', authMiddleware, authRequireType(['funcionario']), pacoteController.getMostBoughtPacotes)

module.exports = router;