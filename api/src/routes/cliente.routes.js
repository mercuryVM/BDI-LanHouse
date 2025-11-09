const router = require('express-promise-router')();
const clienteController = require('../controllers/cliente.controller');

router.get('/getAllClientes', clienteController.getAllClientes);
router.get('/getCliente', clienteController.getCliente);
router.post('/createCliente', clienteController.createCliente);
router.delete('/deleteCliente', clienteController.deleteCliente);
router.put('/updateCliente', clienteController.updateCliente, clienteController.getCliente);

module.exports = router;