const db = require("../config/database");
const argon2 = require('argon2');
const SessionManager = require('../sessions');

exports.login = async (req, res) => {
    const { username, password, maquina } = req.body;
    const { rows } = await db.query(
        "SELECT cpf, loginacesso, senhaacesso FROM cliente WHERE loginacesso = $1",
        [username]
    );
    let user = rows[0];

    if (!user) {
        const funcResponse = await db.query(
            "SELECT cpf, senhaacesso FROM CLT WHERE cpf = $1",
            [username]
        );
        const funcRows = funcResponse.rows;
        user = funcRows[0];
        if (!user) {
            return res.status(404).send({
                errors: ["Usuário não encontrado!"],
                success: false,
            });
        }
    }

    const validPassword = await argon2.verify(user.senhaacesso, password);

    const token = SessionManager.createSession(user.loginacesso ? 'cliente' : 'funcionario', user.cpf);

    if (!validPassword) {
        return res.status(401).send({
            errors: ["Senha inválida!"],
            success: false,

        });
    }

    //se usuário for cliente, registrar sessao
    if (user.loginacesso) {
        const response = await db.query(
            "INSERT INTO sessao (cliente, datetimeinicio, maquina) VALUES ($1, $2, $3)",
            [user.cpf, new Date(), maquina]
        );
        console.log(response)
    }

    res.status(200).send({
        data: token,
        success: true,
    });

    //criar arquivo (classe, não pode importar pq se não vai criar novo mapa) de sessão de usuários logados e nele vai ter que ter uma mapa com strings aleatórias que representam sessões ativas, 
    //linkando com objeto dizendo o que que é pessoa (cliente ou funcionario) e o qual a chave primária dela

    //criar middleare para validar requisição, verificando cabeçario passando a string que é chave no repositorio, 
    //se cabeçalho estiver no repositorio (rec.sessão = objeto que ta no repositorio) next() senão 401
}