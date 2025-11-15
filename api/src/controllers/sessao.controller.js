const db = require("../config/database");

exports.getSessoes = async (req, res) => {
    const { cliente, datetimeinicio, duracao, maquina, ativa } = req.query;
    const params = [];
    let paramCount = 0;

    let query = "SELECT * FROM sessao JOIN cliente ON cliente = cpf WHERE 1=1";

    if (cliente) {
        paramCount++;
        query += ` AND cliente = $${paramCount}`;
        params.push(cliente);
    }

    if (datetimeinicio) {
        paramCount++;
        query += ` AND datetimeinicio = $${paramCount}`;
        params.push(datetimeinicio);
    }

    if (duracao) {
        paramCount++;
        query += ` AND (datetimefim - datetimeinicio) = $${paramCount}::interval`;
        params.push(`${duracao} minutes`);
    }

    if (maquina) {
        paramCount++;
        query += ` AND maquina = $${paramCount}`;
        params.push(maquina);
    }

    if (ativa !== undefined) {
        if (ativa === 'true' || ativa === true) {
            query += ` AND datetimefim IS NULL`;
        } else {
            query += ` AND datetimefim IS NOT NULL`;
        }
    }

    query += " ORDER BY datetimefim NULLS FIRST";

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
                cliente: row.cliente,
                dateTimeInicio: row.datetimeinicio,
                dateTimeFim: row.datetimefim,
                motivotermino: row.motivotermino,
                maquina: row.maquina,
                nome: row.nome,
            }
        })

    });
};