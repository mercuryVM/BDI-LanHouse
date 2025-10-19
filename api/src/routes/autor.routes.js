const router = require('express-promise-router')();
const autorController = require('../controllers/autor.controller');

router.post('/autor', autorController.createAutor);
router.get('/autor', autorController.getAutor);
router.delete('/autor', autorController.deleteAutor);
router.put('/autor', autorController.updateAutor, autorController.getAutor);

module.exports = router;