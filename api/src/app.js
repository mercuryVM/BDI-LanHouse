const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path')

// ==> Rotas da API:
const index = require('./routes/index');

const loginRoute = require('./routes/login.routes');
const userRoute = require('./routes/user.routes');
const agendamentoRoute = require('./routes/agendamento.routes');
const jogoRoute = require('./routes/jogo.routes');
const clienteRoute = require('./routes/cliente.routes');
const maquinaRoute = require('./routes/maquina.routes');
const sessaoRoute = require('./routes/sessao.routes');
const pacoteRoute = require('./routes/pacote.routes');
const manutencaoRoute = require('./routes/manutencao.routes');
const comandaRoute = require('./routes/comanda.routes')

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(index);
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/api/', agendamentoRoute);
app.use('/api/', jogoRoute);
app.use('/api/', userRoute);
app.use('/api/', loginRoute);
app.use('/api/', clienteRoute);
app.use('/api/', maquinaRoute);
app.use('/api/', sessaoRoute);
app.use('/api/', pacoteRoute);
app.use('/api/', manutencaoRoute);
app.use('/api/', comandaRoute);

module.exports = app;