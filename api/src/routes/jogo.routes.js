const router = require('express-promise-router')();
const jogoController = require('../controllers/jogo.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.post('/jogo', authMiddleware, authRequireType(['funcionario']), jogoController.createJogo);
router.get('/jogo', authMiddleware, jogoController.getJogo);
router.get('/getAllJogos', authMiddleware, jogoController.getAllJogos);
router.get('/getRecentJogos', authMiddleware, authRequireType(['cliente']), jogoController.getRecentJogos);
router.delete('/jogo', authMiddleware, authRequireType(['funcionario']), jogoController.deleteJogo);
router.put('/jogo', authMiddleware, authRequireType(['funcionario']), jogoController.updateJogo, jogoController.getJogo);

module.exports = router;