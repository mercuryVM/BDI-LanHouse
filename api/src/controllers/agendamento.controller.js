const db = require("../config/database");

exports.createAgendamento = async (req, res) => {
    const { id, datetimeinicio, datetimefim, tipo, eventoCliente, manutencaoTipo, manutencaoPrioridade } = req.body;
    await db.query(
        "INSERT INTO agendamento (id, datetimeinicio, datetimefim) VALUES ($1, $2, $3)",
        [id, datetimeinicio, datetimefim]
    );

    if (tipo == 'manutencao') {
        await db.query(
            "INSERT INTO manutencao (id, tipo, prioridade) VALUES ($1, $2, $3)",
            [id, manutencaoTipo, manutencaoPrioridade]
        );
    }
    else if (tipo == 'evento'){
        await db.query(
            "INSERT INTO evento (id, cliente) VALUES ($1, $2)",
            [id, eventoCliente]
        );
    }
    res.status(201).send({
        success: true,
        message: "Agendamento adicionado com sucesso!",
        data: {
            agendamento: { id, datetimeinicio, datetimefim }
        },
    });
};

exports.getAgendamento = async (req, res) => {
    const { id } = req.query;
    const { rows } = await db.query(
        "SELECT rg, datetimeinicio, datetimefim FROM agendamento WHERE id = $1",
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
                dateTimeInicio: agendamento.datetimeinicio,
                dateTimeFim: agendamento.datetimefim
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

    const camposPermitidos = ['datetimeinicio', 'datetimefim'];
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