const router = require('express-promise-router')();
const sessaoController = require('../controllers/sessao.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getSessoes', authMiddleware, authRequireType(['funcionario']), sessaoController.getSessoes);
router.post('/iniciarJogoNaSessao', sessaoController.iniciarJogoNaSessao);
router.post('/encerrarJogoNaSessao', sessaoController.encerrarJogoNaSessao);

module.exports = router;