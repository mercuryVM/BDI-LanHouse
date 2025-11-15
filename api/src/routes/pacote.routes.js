const router = require('express-promise-router')();
const pacoteController = require('../controllers/pacote.controller');
const { authMiddleware, authRequireType } = require('../middlewares/auth.middleware');

router.get('/getMostBoughtPacotes', authMiddleware, authRequireType(['funcionario']), pacoteController.getMostBoughtPacotes)
router.get('/getAllPacotes', pacoteController.getAllPacotes); // esse aqui é: os pacotes da loja
// esses outros são: os pacotes que um cliente contratou
router.get('/getAllClientePacotes', authMiddleware, authRequireType(['funcionario']), pacoteController.getAllClientePacotes);
router.get('/getClientePacote', authMiddleware, authRequireType(['funcionario']), pacoteController.getClientePacote);
router.post('/createClientePacote', authMiddleware, authRequireType(['funcionario']), pacoteController.createClientePacote);
router.delete('/deleteClientePacote', authMiddleware, authRequireType(['funcionario']), pacoteController.deleteClientePacote);

module.exports = router;