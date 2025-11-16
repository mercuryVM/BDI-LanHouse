const router = require('express-promise-router')();
const manutencaoController = require('../controllers/manutencao.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getManutencoes', authMiddleware, authRequireType(['funcionario']), manutencaoController.getManutencoes);
router.get('/manutencao', authMiddleware, authRequireType(['funcionario']), manutencaoController.getManutencao);
router.get('/getManutencoesHardware', authMiddleware, authRequireType(['funcionario']), manutencaoController.getManutencoesHardware);

module.exports = router;