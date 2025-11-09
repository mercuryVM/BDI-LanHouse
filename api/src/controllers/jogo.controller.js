const db = require("../config/database");

exports.createJogo = async (req, res) => {
    const { id, nome, descricao, urlimagem, idaderecomendada, inicializacao, multiplayer, plataformas } = req.body;
    await db.query(
        "INSERT INTO jogo (id, nome, descricao, urlimagem, idaderecomendada, inicializacao, multiplayer) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, nome, descricao, urlimagem, idaderecomendada, inicializacao, multiplayer]
    );

    for (let plat of plataformas.length) {
        await db.query(
            "INSERT INTO jogoplataforma (idjogo, nomeplataforma) VALUES ($1, $2)",
            [id, plat]
        );
    }

    res.status(201).send({
        success: true,
        message: "Jogo adicionado com sucesso!",
        data: {
            jogo: { id, nome, descricao, urlimagem, idaderecomendada, inicializacao, multiplayer }
        },
    });
};

exports.getAllJogos = async (req, res) => {
    //pegar todos os jogos e as plataformas associadas sem ficar repetindo jogos porque pode haver multiplas plataformas
    const { rows } = await db.query(`
    SELECT 
            j.id, 
            j.nome, 
            j.descricao, 
            j.urlimagem, 
            j.idaderecomendada, 
            j.inicializacao, 
            j.multiplayer,
            ARRAY_AGG(jp.nomeplataforma) as plataformas
        FROM jogo j 
        LEFT JOIN jogoplataforma jp ON j.id = jp.idjogo
        GROUP BY j.id, j.nome, j.descricao, j.urlimagem, j.idaderecomendada, j.inicializacao, j.multiplayer
        ORDER BY j.nome
    `);

    if (rows.length == 0) {
        return res.status(404).send({
            success: false,
            errors: ["Jogos não encontrados!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Jogos consultado com sucesso!",
        data: rows.map((row) => {
            return {
                id: row.id,
                nome: row.nome,
                descricao: row.descricao,
                urlImagem: row.urlimagem,
                idadeRecomendada: row.idaderecomendada,
                inicializacao: row.inicializacao,
                multiplayer: row.multiplayer,
                plataformas: row.plataformas
            }
        })

    });
};

exports.getJogo = async (req, res) => {
    const { id } = req.query;
    const { rows } = await db.query(`
    SELECT 
            j.id, 
            j.nome, 
            j.descricao, 
            j.urlimagem, 
            j.idaderecomendada, 
            j.inicializacao, 
            j.multiplayer,
            ARRAY_AGG(jp.nomeplataforma) as plataformas
        FROM jogo j 
        LEFT JOIN jogoplataforma jp ON j.id = jp.idjogo
        GROUP BY j.id, j.nome, j.descricao, j.urlimagem, j.idaderecomendada, j.inicializacao, j.multiplayer
        ORDER BY j.nome
        WHERE j.id = $1
    `,
        [id]
    );
    const jogo = rows[0];

    if (!jogo) {
        return res.status(404).send({
            success: false,
            errors: ["Jogo não encontrado!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Jogo consultado com sucesso!",
        data: {
            jogo: {
                id: jogo.id,
                nome: jogo.nome,
                descricao: jogo.descricao,
                urlImagem: jogo.urlimagem,
                idadeRecomendada: jogo.idaderecomendada,
                inicializacao: jogo.inicializacao,
                multiplayer: jogo.multiplayer
            }
        },
    });
};

exports.getRecentJogos = async (req, res) => {
    //pegar id (cliente, datetimeinicio) das ultimas 10 sessões do usuário (pegar as ultimas datetimefim) em sessao, 
    // olhar os ids dos jogos que estão com id dessas sessoes (cliente, datetimeinicio) que estão em sessaojogo e 
    //com os ids dos jogos pegar os dados dos jogos em jogos
    const authHeader = req.headers.authorization;

    const token = authHeader.split(' ')[1];
    const id = SessionManager.getSession(token).userId;

    const { rows } = await db.query(`
        SELECT 
            s.cliente,
            s.datetimeinicio as sessao_inicio,
            s.datetimefim as sessao_fim,
            j.id as jogo_id, 
            j.nome as jogo_nome, 
            j.descricao as jogo_descricao, 
            j.urlimagem as jogo_urlimagem, 
            j.idaderecomendada as jogo_idaderecomendada, 
            j.inicializacao as jogo_inicializacao, 
            j.multiplayer as jogo_multiplayer,
            ARRAY_AGG(jp.nomeplataforma) as plataformas
        FROM sessao s
        JOIN sessaojogo sj ON s.cliente = sj.cliente AND s.datetimeinicio = sj.datetimeinicio
        JOIN jogo j ON sj.jogo = j.id
        LEFT JOIN jogoplataforma jp ON j.id = jp.idjogo
        WHERE s.cliente = $1 
        AND s.datetimeinicio IN (
            SELECT datetimeinicio 
            FROM sessao 
            WHERE cliente = $1 
            ORDER BY datetimefim DESC 
            LIMIT 10
        )
        GROUP BY 
            s.cliente, s.datetimeinicio, s.datetimefim,
            j.id, j.nome, j.descricao, j.urlimagem, j.idaderecomendada, 
            j.inicializacao, j.multiplayer
        ORDER BY s.datetimefim DESC, j.nome

    `, [id]);

    res.status(200).send({
        success: true,
        message: "Jogos consultado com sucesso!",
        data: rows.map((row) => {
            return {
                id: row.id,
                nome: row.nome,
                descricao: row.descricao,
                urlImagem: row.urlimagem,
                idadeRecomendada: row.idaderecomendada,
                inicializacao: row.inicializacao,
                multiplayer: row.multiplayer,
                plataformas: row.plataformas
            }
        })

    });
}

exports.deleteJogo = async (req, res) => {
    const { id } = req.query;
    const { rows } = await db.query(
        "DELETE FROM jogo WHERE id = $1",
        [id]
    );

    res.status(200).send({
        success: true,
        message: "Jogo deletado com sucesso!",
    });
};

exports.updateJogo = async (req, res, next) => {
    const { id } = req.query;

    const camposPermitidos = ['nome', 'descricao', 'urlimagem', 'idaderecomendada', 'multiplayer'];
    const campos = [];

    for (let campoName in req.body) {
        if (!camposPermitidos.includes(campoName)) {
            // só ignora o campo que n é permitido
            continue;
        } else {
            campos.push({
                name: campoName,
                value: req.body[campoName]
            })
        }
    }

    let camposString = campos.map((campo, index) => {
        return `${campo.name} = $${index + 1}`
    })

    const query = `UPDATE jogo SET ${camposString.join(", ")} WHERE id = $${campos.length + 1}`;

    const valores = campos.map(campo => campo.value);
    valores.push(id);

    const update = await db.query(query, valores);

    if (update.rowCount === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Jogo não encontrado!"],
        });
    }

    next();
}