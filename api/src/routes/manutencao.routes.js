const router = require('express-promise-router')();
const manutencaoController = require('../controllers/manutencao.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getManutencoes', authMiddleware, authRequireType(['funcionario']), manutencaoController.getManutencoes);
router.post('/manutencao', authMiddleware, authRequireType(['funcionario']), manutencaoController.createManutencao);
router.put('/manutencao', authMiddleware, authRequireType(['funcionario']), manutencaoController.updateManutencao);
router.delete('/manutencao', authMiddleware, authRequireType(['funcionario']), manutencaoController.deleteManutencao);
router.get('/getHardwaresByMaquina', authMiddleware, authRequireType(['funcionario']), manutencaoController.getHardwaresByMaquina);

module.exports = router;