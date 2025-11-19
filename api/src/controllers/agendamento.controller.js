const db = require("../config/database");
// [Geral] Este controller implementa operações de agendamento ligadas aos RF12 e RF15.

/**
 * RF12 - Gerenciar manutenções, permitindo agendar (e também agendar eventos de cliente).
 * - Cria o registro base em "agendamento"
 * - Quando tipo = 'manutencao', cria o vínculo com a tabela de manutenção (tipo, prioridade)
 * - Quando tipo = 'evento', cria o vínculo com a tabela de evento/cliente
 */
exports.createAgendamento = async (req, res) => {
    const { id, datatempoinicio, datatempofim, tipo, eventoCliente, manutencaoTipo, manutencaoPrioridade } = req.body;
    // RF12 - Criação do registro de agendamento (datas de início e fim)
    await db.query(
        "INSERT INTO agendamento (id, datatempoinicio, datatempofim) VALUES ($1, $2, $3)",
        [id, datatempoinicio, datatempofim]
    );

    if (tipo == 'manutencao') {
        // RF12 - Registro da manutenção associada ao agendamento (tipo e prioridade)
        await db.query(
            "INSERT INTO manutencao (id, tipo, prioridade) VALUES ($1, $2, $3)",
            [id, manutencaoTipo, manutencaoPrioridade]
        );
    }
    else if (tipo == 'evento'){
        // Requisito de dados de agendamento de eventos de cliente (ligação agendamento x cliente)
        await db.query(
            "INSERT INTO evento (id, cliente) VALUES ($1, $2)",
            [id, eventoCliente]
        );
    }
    res.status(201).send({
        success: true,
        message: "Agendamento adicionado com sucesso!",
        data: {
            agendamento: { id, datatempoinicio, datatempofim }
        },
    });
};


/**
 * RF15 - Consultar agendamento
 * - Consulta por ID (um dos filtros previstos no requisito de consulta de agendamentos)
 */
exports.getAgendamento = async (req, res) => {
    const { id } = req.query;

    // RF15 - Seleção do agendamento no banco a partir do identificador
    const { rows } = await db.query(
        "SELECT rg, datatempoinicio, datatempofim FROM agendamento WHERE id = $1",
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
                datatempoinicio: agendamento.datatempoinicio,
                datatempofim: agendamento.datatempofim
            }
        },
    });
};


/**
 * RF12 - Parte do gerenciamento do ciclo de vida da manutenção/evento:
 *       permite remover/cancelar um agendamento existente.
 */
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

/**
 * RF12 - Reagendar agendamento existente:
 *       atualização das datas de início/fim de um agendamento.
 */
exports.updateAgendamento = async (req, res, next) => {
    const { id } = req.query;

    const camposPermitidos = ['datatempoinicio', 'datatempofim'];
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

    // RF12 - Montagem dinâmica da query de atualização do agendamento (reagendamento)
    let camposString = campos.map((campo, index) => {
        return `${campo.name} = $${index + 1}`
    })

    const query = `UPDATE agendamento SET ${camposString.join(", ")} WHERE id = $${campos.length + 1}`;

    const valores = campos.map(campo => campo.value);
    valores.push(id);

    const update = await db.query(query, valores);

    // RF12 - Validação de existência do agendamento ao tentar reagendar
    if (update.rowCount === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Agendamento não encontrado!"],
        });
    }

    next();
}