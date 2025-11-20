const router = require('express-promise-router')();
const comandaController = require('../controllers/comanda.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getAllComandas', comandaController.getAllComandas);
router.get('/getComanda', comandaController.getComanda);
router.get('/getProdutosDaComanda', comandaController.getProdutosDaComanda);
router.post('/abrirComandaDoCliente', comandaController.abrirComandaDoCliente);
router.post('/adicionarProdutoNaComanda', comandaController.adicionarProdutoNaComanda);
router.put('/fecharComandaDoCliente', comandaController.fecharComandaDoCliente)

module.exports = router;