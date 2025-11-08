const router = require('express-promise-router')();
const agendamentoController = require('../controllers/agendamento.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.post('/agendamento', authMiddleware, authRequireType(['funcionario']), agendamentoController.createAgendamento);
router.get('/agendamento', authMiddleware, authRequireType(['funcionario']), agendamentoController.getAgendamento);
router.delete('/agendamento', authMiddleware, authRequireType(['funcionario']), agendamentoController.deleteAgendamento);
router.put('/agendamento', authMiddleware, authRequireType(['funcionario']), agendamentoController.updateAgendamento, agendamentoController.getAgendamento);

module.exports = router;