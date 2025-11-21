const router = require('express-promise-router')();
const eventoController = require('../controllers/evento.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getEventos', authMiddleware, eventoController.getEventos);
router.post('/createEvento', authMiddleware, authRequireType(['funcionario']), eventoController.createEvento);
router.put('/updateEvento', authMiddleware, authRequireType(['funcionario']), eventoController.updateEvento);
router.delete('/deleteEvento', authMiddleware, authRequireType(['funcionario']), eventoController.deleteEvento);

module.exports = router;
