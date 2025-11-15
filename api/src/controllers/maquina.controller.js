const db = require("../config/database");

exports.pingMaquina = async (req, res) => {
    const id = req.body.id;

    await db.query(
        "UPDATE maquina SET lastseen = $1 WHERE id = $2",
        [new Date(), id]
    );

    res.status(200).send({
        success: true,
    });
}

exports.getMostUsedMaquinas = async (req, res) => {
    const { rows } = await db.query(
        `SELECT COUNT(*) as usos, m.id as maquinaId, p.nome as nomePlat, p.tipo as tipoPlat
        FROM maquina m 
        JOIN sessao s ON m.id = s.maquina 
        JOIN plataforma p ON m.nomeplat = p.nome
        GROUP BY m.id, p.nome, p.tipo
        ORDER BY usos 
        DESC LIMIT 10 
        `
    )

    res.status(200).send({
        success: true,
        message: "Maquinas consultadas com sucesso!",
        data: rows.map((row) => {
            return {
                usos: row.usos,
                id: row.maquinaId,
                nomePlataforma: row.nomePlat,
                tipoPlataforma: row.tipoPlat
            }
        })
    })
}

exports.getAllMaquinas = async (req, res) => {
    const { rows } = await db.query(
        "SELECT * FROM maquina LEFT JOIN Plataforma ON maquina.nomeplat = Plataforma.nome ORDER BY lastseen DESC"
    );

    res.status(200).send({
        success: true,
        data: rows
    });
}

exports.getMostFixedMaquinas = async (req, res) => {
    const { rows } = await db.query(
        `SELECT COUNT(*) as vezesConsertada, m.id as maquinaId, p.nome as nomePlat, p.tipo as tipoPlat
        FROM maquina m 
        JOIN manutencaomaquina man ON m.id = man.idmaquina 
        JOIN plataforma p ON m.nomeplat = p.nome
        GROUP BY m.id, p.nome, p.tipo
        ORDER BY vezesConsertada 
        DESC LIMIT 10 
        `
    )

    res.status(200).send({
        success: true,
        message: "Maquinas consultadas com sucesso!",
        data: rows.map((row) => {
            return {
                vezesConsertada: row.vezesConsertada,
                id: row.maquinaId,
                nomePlataforma: row.nomePlat,
                tipoPlataforma: row.tipoPlat
            }
        })
    })
}