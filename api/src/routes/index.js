const { Router } = require('express');

const router = Router();

router.get('/api', (req, res) => {
  res.status(200).send({
    success: 'true',
    message: 'Seja bem-vindo(a) a API Node.js + PostgreSQL!',
    version: '1.0.0',
  });
});

module.exports = router;