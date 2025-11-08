const db = require("../config/database");

exports.createAgendamento = async (req, res) => {
    const { id, dataHoraInicio, dataHoraFim } = req.body;
    const { rows } = await db.query(
        "INSERT INTO agendamento (id, dataHoraInicio, dataHoraFim) VALUES ($1, $2, $3)",
        [id, dataHoraInicio, dataHoraFim]
    );
    res.status(201).send({
        success: true,
        message: "Agendamento adicionado com sucesso!",
        data: {
            agendamento: { id, dataHoraInicio, dataHoraFim }
        },
    });
};

exports.getAgendamento = async (req, res) => {
    const { id } = req.query; 
    const { rows } = await db.query(
        "SELECT rg, dataHoraInicio, dataHoraFim FROM agendamento WHERE id = $1",
        [id]
    );
    const agendamento = rows[0];

    if (!agendamento) {
        return res.status(404).send({
            success: false,
            errors: ["Agendamento não encontrado!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Agendamento consultado com sucesso!",
        data: {
            agendamento: {
                id: agendamento.id,
                datahorainicio: agendamento.datahorainicio,
                datahorafim: agendamento.datahorafim
            }
        },
    });
};

exports.deleteAgendamento = async (req, res) => {
    const { id } = req.query; 
    const { rows } = await db.query(
        "DELETE FROM agendamento WHERE id = $1",
        [id]
    );

    res.status(200).send({
        success: true,
        message: "Agendamento deletado com sucesso!",
    });
};

exports.updateAgendamento = async (req, res, next) => {
    const { id } = req.query; 

    const camposPermitidos = ['datahorainicio', 'datahorafim'];
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

    const query = `UPDATE agendamento SET ${camposString.join(", ")} WHERE id = $${campos.length + 1}`;

    const valores = campos.map(campo => campo.value);
    valores.push(id);

    const update = await db.query(query, valores);

    if (update.rowCount === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Agendamento não encontrado!"],
        });
    }

    next();
}