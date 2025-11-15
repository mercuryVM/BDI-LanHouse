const router = require('express-promise-router')();
const maquinaController = require('../controllers/maquina.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.post('/pingMaquina', maquinaController.pingMaquina);
router.get('/getMostUsedMaquinas', authMiddleware, authRequireType['funcionario'], maquinaController.getMostUsedMaquinas)

module.exports = router;