const express = require('express');
const cors = require('cors');
const app = express();

// ==> Rotas da API:
const index = require('./routes/index');

const autorRoute = require('./routes/autor.routes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(index);
app.use('/api/', autorRoute);

module.exports = app;