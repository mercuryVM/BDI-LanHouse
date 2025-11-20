const router = require('express-promise-router')();
const maquinaController = require('../controllers/maquina.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getMostUsedMaquinas', authMiddleware, authRequireType(['funcionario']), maquinaController.getMostUsedMaquinas);
router.get('/getMostFixedMaquinas', authMiddleware, authRequireType(['funcionario']), maquinaController.getMostFixedMaquinas);
router.post('/pingMaquina', maquinaController.pingMaquina);
router.get('/getAllMaquinas', authMiddleware, maquinaController.getAllMaquinas);
router.get('/getHardwaresDisponiveis', authMiddleware, maquinaController.getHardwaresDisponiveis);
router.post('/addHardwareToMaquina', authMiddleware, authRequireType(['funcionario']), maquinaController.addHardwareToMaquina);
router.post('/removeHardwareFromMaquina', authMiddleware, authRequireType(['funcionario']), maquinaController.removeHardwareFromMaquina);

module.exports = router;