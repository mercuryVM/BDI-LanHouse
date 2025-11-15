const db = require("../config/database");
const SessionManager = require('../sessions');

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
    //pegar id (cliente, datatempoinicio) das ultimas 10 sessões do usuário (pegar as ultimas datatempofim) em sessao, 
    // olhar os ids dos jogos que estão com id dessas sessoes (cliente, datatempoinicio) que estão em sessaojogo e 
    //com os ids dos jogos pegar os dados dos jogos em jogos
    const authHeader = req.headers.authorization;

    const token = authHeader.split(' ')[1];
    const id = SessionManager.getSession(token).userId;

    const { rows } = await db.query(`
        SELECT 
            s.cliente,
            s.datatempoinicio as sessao_inicio,
            s.datatempofim as sessao_fim,
            j.id as jogo_id, 
            j.nome as jogo_nome, 
            j.descricao as jogo_descricao, 
            j.urlimagem as jogo_urlimagem, 
            j.idaderecomendada as jogo_idaderecomendada, 
            j.inicializacao as jogo_inicializacao, 
            j.multiplayer as jogo_multiplayer,
            ARRAY_AGG(jp.nomeplataforma) as plataformas
        FROM sessao s
        JOIN sessaojogo sj ON s.cliente = sj.cliente AND s.datatempoinicio = sj.datatempoinicio
        JOIN jogo j ON sj.jogo = j.id
        LEFT JOIN jogoplataforma jp ON j.id = jp.idjogo
        WHERE s.cliente = $1 
        AND s.datatempoinicio IN (
            SELECT datatempoinicio 
            FROM sessao 
            WHERE cliente = $1 
            ORDER BY datatempofim DESC 
            LIMIT 10
        )
        GROUP BY 
            s.cliente, s.datatempoinicio, s.datatempofim,
            j.id, j.nome, j.descricao, j.urlimagem, j.idaderecomendada, 
            j.inicializacao, j.multiplayer
        ORDER BY s.datatempofim DESC, j.nome

    `, [id]);

    res.status(200).send({
        success: true,
        message: "Jogos consultado com sucesso!",
        data: rows.map((row) => {
            return {
                id: row.jogo_id,
                nome: row.jogo_nome,
                descricao: row.jogo_descricao,
                urlImagem: row.jogo_urlimagem,
                idadeRecomendada: row.jogo_idaderecomendada,
                inicializacao: row.jogo_inicializacao,
                multiplayer: row.jogo_multiplayer,
                plataformas: row.plataformas
            }
        })

    });
}

exports.getMostPlayedJogos = async (req, res) => {

    //TODO: colocar datatimefim em sessaojogo (banco e cod
    /*
    WITH sessoes_por_jogo AS (
    SELECT 
        j.id AS jogo_id,
        j.nome,
        j.descricao,
        j.urlimagem,
        j.idaderecomendada,
        j.inicializacao,
        j.multiplayer,
        COUNT(*) AS numero_sessoes,
        AVG(EXTRACT(EPOCH FROM (s.datatempofim - s.datatempoinicio)) / 60) 
            AS tempo_medio_minutos
    FROM sessaojogo s
    JOIN jogo j ON j.id = s.jogo
    GROUP BY j.id
),
    */

    const { rows } = await db.query(
        `WITH sessoes_por_jogo AS (
            SELECT 
                j.id AS jogo_id,
                j.nome,
                j.descricao,
                j.urlimagem,
                j.idaderecomendada,
                j.inicializacao,
                j.multiplayer,
                COUNT(*) AS numero_sessoes
            FROM sessaojogo s
            JOIN jogo j ON j.id = s.jogo
            GROUP BY j.id
        ),

        pico_horario AS (
            SELECT 
                s.jogo,
                EXTRACT(HOUR FROM s.datatempoinicio) AS hora,
                COUNT(*) AS total_na_hora,
                ROW_NUMBER() OVER (
                    PARTITION BY s.jogo 
                    ORDER BY COUNT(*) DESC
                ) AS rn
            FROM sessaojogo s
            GROUP BY s.jogo, hora
        )

        SELECT 
            spj.numero_sessoes AS numerosessoes,
            ph.hora AS pico_hora,
            spj.jogo_id AS jogo_id,
            spj.nome AS jogo_nome,
            spj.descricao AS jogo_descricao,
            spj.urlimagem AS jogo_urlimagem,
            spj.idaderecomendada AS jogo_idaderecomendada,
            spj.inicializacao AS jogo_inicializacao,
            spj.multiplayer AS jogo_multiplayer
        FROM sessoes_por_jogo spj
        JOIN pico_horario ph ON spj.jogo_id = ph.jogo
        WHERE ph.rn = 1      
        ORDER BY spj.numero_sessoes DESC
        LIMIT 10;
        `
    );

    res.status(200).send({
        success: true,
        message: "Jogos consultado com sucesso!",
        data: rows.map((row) => {
            return {
                id: row.jogo_id,
                nome: row.jogo_nome,
                descricao: row.jogo_descricao,
                urlImagem: row.jogo_urlimagem,
                idadeRecomendada: row.jogo_idaderecomendada,
                inicializacao: row.jogo_inicializacao,
                multiplayer: row.jogo_multiplayer,
                numeroSessoes: row.numerosessoes,
                picoHora: row.pico_hora
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