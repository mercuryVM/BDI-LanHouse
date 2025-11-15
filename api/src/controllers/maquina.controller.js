const db = require("../config/database");

exports.pingMaquina = async (req, res) => {
    const id = req.body.id;

    await db.query(
        "UPDATE maquina SET lastseen = NOW() WHERE id = $1",
        [id]
    );

    res.status(200).send({
        success: true,
    });
}