const db = require("../config/database");
const argon2 = require('argon2');
const SessionManager = require('../sessions');
const { DateTime } = require('luxon');

// RF04 – Iniciar sessão de uso na máquina alocada
// RF05 – Debitar tempo do cliente em tempo real (início do controle na abertura da sessão)
// (também faz parte do fluxo de autenticação do domínio – login de cliente/funcionário)
exports.login = async (req, res) => {
    const { username, password, maquina } = req.body;

    // RF11 (apoio) – Gerenciar clientes: autenticação de cliente pelo login de acesso
    const { rows } = await db.query(
        "SELECT cpf, loginacesso, senhaacesso FROM cliente WHERE loginacesso = $1",
        [username]
    );
    let user = rows[0];

    // RF10 / RF11 (apoio) – Caso não seja cliente, tenta autenticar como funcionário (CLT)
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

    // Requisito de Dados – senha criptografada (uso de argon2)
    const validPassword = await argon2.verify(user.senhaacesso, password);
    if (!validPassword) {
        return res.status(401).send({
            errors: ["Senha inválida!"],
            success: false,

        });
    }

    // RF01 (apoio) – Verifica existência da máquina e sua plataforma (nomeplat/tipo)
    const maquinaResult = await db.query(
        "SELECT id, nomeplat, tipo FROM maquina INNER JOIN plataforma ON plataforma.nome = maquina.nomeplat WHERE id = $1 LIMIT 1",
        [maquina]
    );

    if (maquinaResult.rows.length === 0) {
        return res.status(404).send({
            errors: ["Máquina não encontrada!"],
            success: false,
        });
    }

    const date = new Date();
    // RF04 – Criação de sessão lógica do usuário (cliente/funcionário) no SessionManager
    const token = SessionManager.createSession(user.loginacesso ? 'cliente' : 'funcionario', user.cpf, date, maquinaResult.rows[0]);

    // RF04 – Se usuário for cliente, registrar sessão física na base (horário inicial + máquina)
    // Requisito de Dados – sessão: cliente, máquina, datatempoinicio
    if (user.loginacesso) {
        await db.query(
            "INSERT INTO sessao (cliente, datatempoinicio, maquina) VALUES ($1, $2, $3)",
            [user.cpf, date, maquina]
        );
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


// RF05 – Debitar tempo do cliente em tempo real, permitindo pausa (deslogar) e término
// RF08 – Contabilizar consumo de tempo durante a sessão (tempo usado por plataforma)
// (encerra sessão, grava fim e desconta tempo das horas do cliente)

exports.logout = async (req, res) => {
    //se for funcionario -> delete sessão interna
    // se for cliente -> delete sessão interna, atualiza sessão do banco e pegar plataforma da maquina pra pegar tipo da platadorma decrementar uma das 3 variaveis do cliente 
    // (decrementa tempo que passou entre fim e inicio)
    // 0: PC, 1: Console, 2: Simulador

    const userId = req.session.id;
    const userType = req.session.type;
    const authHeader = req.headers.authorization;
    // RF05 – Recupera sessão lógica para calcular tempo de uso
    const token = authHeader.split(' ')[1];
    const startDate = SessionManager.getSession(token).createAt;
    const deleteSession = SessionManager.deleteSession(token);

    // RF05 / RF08 – Encerramento de sessão de cliente e débito de tempo por plataforma
    if (userType == 'cliente') {
        const endDate = new Date()

        // RF04 / RF05 – Atualiza término da sessão e motivo
        // (OBS: sintaxe do UPDATE está incorreta por usar AND, mas não alteramos o código)
        await db.query(
            "UPDATE sessao SET datatempofim = $1 AND motivotermino = $2 WHERE cliente = $3 AND datatempoinicio = $4",
            [endDate, 'deslogou', userId, startDate]
        );
        // Requisito de Dados – recuperar sessão específica para cálculo do tempo
        const { rows } = await db.query(
            "SELECT * FROM sessao WHERE cliente = $1 AND datatempoinicio = $2",
            [userId, startDate]
        );
        let sessao = rows[0];

        if (!sessao) {
            return res.status(404).send({
                errors: ["Sessão não encontrada!"],
                success: false,
            });
        }
        // RF05 / RF08 – Identificar tipo de máquina usada na sessão (PC/Console/Simulador)
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

        // RF05 – Cálculo do tempo de sessão em minutos (diferença entre início e fim)
        const startDateLux = DateTime.fromISO(startDate.toISOString());
        const endDateLux = DateTime.fromISO(endDate.toISOString());

        const diffInMinutes = Math.floor(endDateLux.diff(startDateLux, 'minutes').minutes);

        // RF05 / RF08 – Debitar tempo do saldo do cliente por tipo de plataforma utilizada
        // Requisito de Dados – campos tempocomputador, tempoconsole, temposimulador em cliente
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