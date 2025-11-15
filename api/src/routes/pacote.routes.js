const router = require('express-promise-router')();
const pacoteController = require('../controllers/pacote.controller');

router.get('/getAllPacotes', pacoteController.getAllPacotes); // esse aqui é: os pacotes da loja
router.get('/getClientePacote', pacoteController.getClientePacote);
// esses outros são: os pacotes que um cliente contratou
router.post('/createClientePacote', pacoteController.createClientePacote);
router.delete('/deleteClientePacote', pacoteController.deleteClientePacote);

module.exports = router;