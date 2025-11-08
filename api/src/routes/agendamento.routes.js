const router = require('express-promise-router')();
const agendamentoController = require('../controllers/agendamento.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/agendamento', authMiddleware, agendamentoController.createAgendamento);
router.get('/agendamento', authMiddleware, agendamentoController.getAgendamento);
router.delete('/agendamento', authMiddleware, agendamentoController.deleteAgendamento);
router.put('/agendamento', authMiddleware, agendamentoController.updateAgendamento, agendamentoController.getAgendamento);

module.exports = router;