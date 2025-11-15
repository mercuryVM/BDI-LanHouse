const router = require('express-promise-router')();
const maquinaController = require('../controllers/maquina.controller');

router.post('/pingMaquina', maquinaController.pingMaquina);

module.exports = router;