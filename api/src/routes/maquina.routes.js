const router = require('express-promise-router')();
const maquinaController = require('../controllers/maquina.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/pingMaquina', maquinaController.pingMaquina);
router.get('/getAllMaquinas', authMiddleware, maquinaController.getAllMaquinas);

module.exports = router;