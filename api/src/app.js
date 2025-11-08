const express = require('express');
const cors = require('cors');
const app = express();

// ==> Rotas da API:
const index = require('./routes/index');

const loginRoute = require('./routes/login.routes');
const userRoute = require('./routes/user.routes');
const agendamentoRoute = require('./routes/agendamento.routes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(index);

app.use('/api/', agendamentoRoute);
app.use('/api/', userRoute);
app.use('/api/', loginRoute);

module.exports = app;