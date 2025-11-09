const db = require("../config/database");

exports.createJogo = async (req, res) => {
    const { id, nome, descricao, urlimagem, idaderecomendada, inicializacao } = req.body;
    await db.query(
        "INSERT INTO jogo (id, nome, descricao, urlimagem, idaderecomendada, inicializacao) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, nome, descricao, urlimagem, idaderecomendada, inicializacao]
    );
    res.status(201).send({
        success: true,
        message: "Jogo adicionado com sucesso!",
        data: {
            jogo: { id, nome, descricao, urlimagem, idaderecomendada, inicializacao }
        },
    });
};

exports.getAllJogos = async (req, res) => {
    const { rows } = await db.query(
        "SELECT * FROM jogo",
        [id]
    );

    if (!jogo) {
        return res.status(404).send({
            success: false,
            errors: ["Jogo não encontrado!"],
        });
    }

        res.status(200).send({
            success: true,
            message: "Jogo consultado com sucesso!",
            data: rows.map((row) => {
                return {
                    id: row.id,
                    nome: row.nome,
                    descricao: row.descricao,
                    urlImagem: row.urlimagem,
                    idadeRecomendada: row.idaderecomendada,
                    inicializacao: row.inicializacao,
                    plataforma: row.plataforma
                }
            })

        });
};

exports.getJogo = async (req, res) => {
    const { id } = req.query;
    const { rows } = await db.query(
        "SELECT * FROM jogo WHERE id = $1",
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
                plataforma: jogo.plataforma
            }
        },
    });
};

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