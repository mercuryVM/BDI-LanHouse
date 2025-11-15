const db = require("../config/database");

exports.getSessoes = async (req, res) => {
    const { cliente, datatempoinicio, duracao, maquina, ativa } = req.query;
    const params = [];
    let paramCount = 0;

    let query = "SELECT * FROM sessao JOIN cliente ON cliente = cpf JOIN maquina ON maquina.id = sessao.maquina WHERE 1=1";

    if (cliente) {
        paramCount++;
        query += ` AND cliente = $${paramCount}`;
        params.push(cliente);
    }

    if (datatempoinicio) {
        paramCount++;
        query += ` AND datatempoinicio = $${paramCount}`;
        params.push(datatempoinicio);
    }

    if (duracao) {
        paramCount++;
        query += ` AND (datatempofim - datatempoinicio) = $${paramCount}::interval`;
        params.push(`${duracao} minutes`);
    }

    if (maquina) {
        paramCount++;
        query += ` AND maquina = $${paramCount}`;
        params.push(maquina);
    }

    if (ativa !== undefined) {
        if (ativa === 'true' || ativa === true) {
            query += ` AND datatempofim IS NULL`;
        } else {
            query += ` AND datatempofim IS NOT NULL`;
        }
    }

    query += " ORDER BY datatempofim NULLS FIRST";

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Nenhuma sessão encontrada!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Sessões consultadas com sucesso!",
        data: rows.map((row) => {
            return {
                id: row.id,
                cliente: {
                    cpf: row.cliente,
                    nome: row.nome,
                },
                datatempoinicio: row.datatempoinicio,
                datatempofim: row.datatempofim,
                motivotermino: row.motivotermino,
                maquina: {
                    id: row.maquina,
                    lastseen: row.lastseen,
                    nomeplat: row.nomeplat
                }
            }
        })

    });
};