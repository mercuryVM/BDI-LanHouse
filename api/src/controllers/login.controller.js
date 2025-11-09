const db = require("../config/database");
const argon2 = require('argon2');
const SessionManager = require('../sessions');
const { DateTime } = require('luxon');

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

    const date = new Date();

    const token = SessionManager.createSession(user.loginacesso ? 'cliente' : 'funcionario', user.cpf, date);

    if (!validPassword) {
        return res.status(401).send({
            errors: ["Senha inválida!"],
            success: false,

        });
    }

    //se usuário for cliente, registrar sessao
    if (user.loginacesso) {
        await db.query(
            "INSERT INTO sessao (cliente, datetimeinicio, maquina) VALUES ($1, $2, $3)",
            [user.cpf, date, maquina]
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

exports.logout = async (req, res) => {
    //se for funcionario -> delete sessão interna
    // se for cliente -> delete sessão interna, atualiza sessão do banco e pegar plataforma da maquina pra pegar tipo da platadorma decrementar uma das 3 variaveis do cliente 
    // (decrementa tempo que passou entre fim e inicio)
    // 0: PC, 1: Console, 2: Simulador
    const userId = req.session.id;
    const userType = req.session.type;
    const authHeader = req.headers.authorization;

    const token = authHeader.split(' ')[1];
    const startDate = SessionManager.getSession(token).createAt;
    const deleteSession = SessionManager.deleteSession(token);

    if (userType == 'cliente') {
        const endDate = new Date()

        await bd.query(
            "UPDATE sessao SET datetimefim = $1 WHERE cliente = $2 AND datetimeinicio = $3",
            [endDate, userId, startDate]
        );

        const { rows } = await db.query(
            "SELECT * FROM sessao WHERE cliente = $1 AND datetimeinicio = $2",
            [userId, startDate]
        );
        let sessao = rows[0];

        if (!sessao) {
            return res.status(404).send({
                errors: ["Sessão não encontrada!"],
                success: false,
            });
        }

        const maqResponse = await db.query(
            "SELECT tipo FROM maquina JOIN plataforma ON nomeplat = nome WHERE id = $1",
            [sessao.maquina]
        );
        const maqRow = maqResponse.rows;
        let tipoMaq = maqRow[0];

        if (!tipoMaq) {
            return res.status(404).send({
                errors: ["Tipo de máquina não encontrado!"],
                success: false,
            });
        }

        const startDateLux = DateTime.fromISO(startDate.toISOString());
        const endDateLux = DateTime.fromISO(endDate.toISOString());

        const diffInMinutes = endDateLux.diff(startDateLux, 'minutes').minutes;

        switch (tipoMaq.tipo) {
            case 0:
                await db.query(
                    "UPDATE cliente SET tempocomputador = tempocomputador - $1 WHERE cpf = $2",
                    [diffInMinutes, userId]
                );
                break;
            case 1:
                await db.query(
                    "UPDATE cliente SET tempoconsole = tempoconsole - $1 WHERE cpf = $2",
                    [diffInMinutes, userId]
                );
                break;
            case 2:
                await db.query(
                    "UPDATE cliente SET temposimulador = temposimulador - $1 WHERE cpf = $2",
                    [diffInMinutes, userId]
                );
                break;

        }
    }

    res.status(200).send({
        success: true,
    });
}