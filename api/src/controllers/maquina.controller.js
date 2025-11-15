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

exports.getAllMaquinas = async (req, res) => {
    const { rows } = await db.query(
        "SELECT * FROM maquina LEFT JOIN Plataforma ON maquina.nomeplat = Plataforma.nome ORDER BY lastseen DESC"
    );

    res.status(200).send({
        success: true,
        data: rows,
    });
}