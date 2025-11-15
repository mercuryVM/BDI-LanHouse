const router = require('express-promise-router')();
const produtoController = require('../controllers/produto.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getProdutos', authMiddleware, authRequireType(['funcionario']), produtoController.getProdutos);
router.get('/produto', authMiddleware, authRequireType(['funcionario']), produtoController.getproduto);

module.exports = router;