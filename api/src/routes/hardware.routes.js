const router = require('express-promise-router')();
const hardwareController = require('../controllers/hardware.controller');
const {authMiddleware, authRequireType} = require('../middlewares/auth.middleware');

router.get('/getAllHardwares', authMiddleware, hardwareController.getAllHardwares);
router.get('/getEstoqueStats', authMiddleware, hardwareController.getEstoqueStats);
router.get('/getTiposHardware', authMiddleware, hardwareController.getTiposHardware);
router.get('/getEstadosHardware', authMiddleware, hardwareController.getEstadosHardware);
router.post('/createHardware', authMiddleware, authRequireType(['funcionario']), hardwareController.createHardware);
router.put('/updateHardware', authMiddleware, authRequireType(['funcionario']), hardwareController.updateHardware);
router.delete('/deleteHardware', authMiddleware, authRequireType(['funcionario']), hardwareController.deleteHardware);

module.exports = router;
