const db = require("../config/database");

// RF12 – Consultar múltiplas manutenções com filtros
// • Filtro por prioridade
// • Filtro por tipo (preventiva/corretiva)
// • Filtro por período (hoje, amanhã, X dias…)
// • RF13 – permite identificar quais máquinas estão bloqueadas
// • RF14 – permite consultas para máquinas com mais defeitos/manutenções
exports.getManutencoes = async (req, res) => {
    const { prioridade, tipo, periodo } = req.query;
    const params = [];
    let paramCount = 0;

    // RF12 – Base da consulta geral de manutenções (uma linha por manutenção)
    let query = `SELECT DISTINCT
            m.id AS manutencaoID,
            m.tipo AS manutencaoTipo,
            m.prioridade AS manutencaoPrioridade,
            a.datatempoinicio AS manutencaodatatempoinicio,
            a.datatempofim AS manutencaodatatempofim,
            f.nome as nomeFuncionario,
            f.cpf as cpfFuncionario,
            CASE m.prioridade 
                WHEN 'Alta' THEN 1 
                WHEN 'Média' THEN 2 
                WHEN 'Baixa' THEN 3 
                ELSE 4 
            END as prioridadeOrdem
        FROM manutencao m 
        LEFT JOIN agendamento a ON m.id = a.id 
        JOIN funcionario f ON a.agendadopor = f.cpf
        WHERE 1=1`;

    // RF12 – Filtro por prioridade da manutenção
    if (prioridade) {
        paramCount++;
        query += ` AND m.prioridade = $${paramCount}`;
        params.push(prioridade);
    }
    // RF12 – Filtro por tipo de manutenção (preventiva/corretiva)
    if (tipo) {
        paramCount++;
        query += ` AND m.tipo = $${paramCount}`;
        params.push(tipo);
    }
    // RF12 – Filtro por período: hoje, amanhã, X dias, esta semana…
    if (periodo) {
        const dias = parseInt(periodo);
        if (!isNaN(dias) && dias > 0) {
            paramCount++;
            query += ` AND a.datatempoinicio::date BETWEEN CURRENT_DATE AND CURRENT_DATE + $${paramCount}::INTERVAL`;
            params.push(`${dias} days`);
        }
    }

    // Ordenar por prioridade (Alta > Média > Baixa) e depois por data
    query += ` ORDER BY prioridadeOrdem, manutencaodatatempoinicio DESC NULLS LAST`;

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Nenhuma manutenção encontrada!"],
        });
    }

    // Para cada manutenção, buscar máquinas e hardwares afetados
    const manutencoesComDetalhes = await Promise.all(rows.map(async (manutencao) => {
        // Buscar máquinas afetadas
        const maquinasResult = await db.query(
            `SELECT DISTINCT
                maq.id AS maquinaID, 
                maq.nomeplat,
                p.tipo as tipoPlat
            FROM manutencaomaquina manMaq
            JOIN maquina maq ON manMaq.idmaquina = maq.id
            JOIN plataforma p ON maq.nomeplat = p.nome
            WHERE manMaq.idmanutencao = $1`,
            [manutencao.manutencaoid]
        );

        // Buscar hardwares afetados com seus motivos
        const hardwaresResult = await db.query(
            `SELECT 
                h.id AS hardwareID,
                h.nome AS hardwareNome,
                h.estado AS hardwareEstado,
                h.tipo AS hardwareTipo,
                manMaq.motivo AS motivo
            FROM manutencaomaquina manMaq
            JOIN hardware h ON manMaq.idhardware = h.id
            WHERE manMaq.idmanutencao = $1 AND manMaq.idhardware IS NOT NULL`,
            [manutencao.manutencaoid]
        );

        return {
            manutencaoid: manutencao.manutencaoid,
            manutencaotipo: manutencao.manutencaotipo,
            manutencaoprioridade: manutencao.manutencaoprioridade,
            manutencaodatatempoinicio: manutencao.manutencaodatatempoinicio,
            manutencaodatatempofim: manutencao.manutencaodatatempofim,
            nomefuncionario: manutencao.nomefuncionario,
            cpffuncionario: manutencao.cpffuncionario,
            maquinas: maquinasResult.rows.map(m => ({
                maquinaid: m.maquinaid,
                nomeplat: m.nomeplat,
                tipoplat: m.tipoplat
            })),
            hardwares: hardwaresResult.rows.map(h => ({
                hardwareid: h.hardwareid,
                hardwarenome: h.hardwarenome,
                hardwareestado: h.hardwareestado,
                hardwaretipo: h.hardwaretipo,
                motivo: h.motivo
            }))
        };
    }));

    res.status(200).send({
        success: true,
        message: "Manutenções consultadas com sucesso!",
        data: manutencoesComDetalhes
    });
};

// RF12 – Criar nova manutenção
// • Cria manutenção + agendamento + relacionamento com máquina
exports.createManutencao = async (req, res) => {
    const { 
        tipo, 
        prioridade, 
        datatempoinicio, 
        datatempofim, 
        maquinaId, 
        agendadoPor,
        hardwareIds, // Array de números (legacy) ou array de objetos {hardwareId, motivo}
        hardwares // Array de objetos {hardwareId, motivo}
    } = req.body;

    try {
        // Gera ID único para agendamento/manutenção
        const idResult = await db.query(
            "SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM agendamento"
        );
        const id = idResult.rows[0].nextid;

        // RF12 – Cria agendamento base
        await db.query(
            "INSERT INTO agendamento (id, datatempoinicio, datatempofim, agendadopor) VALUES ($1, $2, $3, $4)",
            [id, datatempoinicio, datatempofim, agendadoPor]
        );

        // RF12 – Cria registro de manutenção
        await db.query(
            "INSERT INTO manutencao (id, tipo, prioridade) VALUES ($1, $2, $3)",
            [id, tipo, prioridade]
        );

        // RF13 – Vincula manutenção com máquina e opcionalmente hardwares com motivos
        const hardwaresList = hardwares || (hardwareIds ? hardwareIds.map(id => ({ hardwareId: id, motivo: null })) : []);
        
        if (hardwaresList && hardwaresList.length > 0) {
            for (const hw of hardwaresList) {
                await db.query(
                    "INSERT INTO manutencaomaquina (idmanutencao, idmaquina, idhardware, motivo) VALUES ($1, $2, $3, $4)",
                    [id, maquinaId, hw.hardwareId, hw.motivo || null]
                );
            }
        } else {
            await db.query(
                "INSERT INTO manutencaomaquina (idmanutencao, idmaquina) VALUES ($1, $2)",
                [id, maquinaId]
            );
        }

        res.status(201).send({
            success: true,
            message: "Manutenção criada com sucesso!",
            data: { id }
        });
    } catch (error) {
        console.error("Erro ao criar manutenção:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao criar manutenção: " + error.message]
        });
    }
};

// RF12 – Atualizar manutenção existente
exports.updateManutencao = async (req, res) => {
    const { id } = req.query;
    const { tipo, prioridade, datatempoinicio, datatempofim } = req.body;

    try {
        // Atualiza manutenção
        if (tipo || prioridade) {
            const fields = [];
            const values = [];
            let paramCount = 0;

            if (tipo) {
                paramCount++;
                fields.push(`tipo = $${paramCount}`);
                values.push(tipo);
            }
            if (prioridade) {
                paramCount++;
                fields.push(`prioridade = $${paramCount}`);
                values.push(prioridade);
            }

            if (fields.length > 0) {
                paramCount++;
                values.push(id);
                await db.query(
                    `UPDATE manutencao SET ${fields.join(', ')} WHERE id = $${paramCount}`,
                    values
                );
            }
        }

        // Atualiza agendamento
        if (datatempoinicio || datatempofim) {
            const fields = [];
            const values = [];
            let paramCount = 0;

            if (datatempoinicio) {
                paramCount++;
                fields.push(`datatempoinicio = $${paramCount}`);
                values.push(datatempoinicio);
            }
            if (datatempofim) {
                paramCount++;
                fields.push(`datatempofim = $${paramCount}`);
                values.push(datatempofim);
            }

            if (fields.length > 0) {
                paramCount++;
                values.push(id);
                await db.query(
                    `UPDATE agendamento SET ${fields.join(', ')} WHERE id = $${paramCount}`,
                    values
                );
            }
        }

        res.status(200).send({
            success: true,
            message: "Manutenção atualizada com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao atualizar manutenção:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao atualizar manutenção: " + error.message]
        });
    }
};

// RF12 – Deletar manutenção
exports.deleteManutencao = async (req, res) => {
    const { id } = req.query;

    try {
        // Remove relacionamentos máquina-manutenção
        await db.query(
            "DELETE FROM manutencaomaquina WHERE idmanutencao = $1",
            [id]
        );

        // Remove manutenção
        await db.query(
            "DELETE FROM manutencao WHERE id = $1",
            [id]
        );

        // Remove agendamento
        await db.query(
            "DELETE FROM agendamento WHERE id = $1",
            [id]
        );

        res.status(200).send({
            success: true,
            message: "Manutenção deletada com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao deletar manutenção:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao deletar manutenção: " + error.message]
        });
    }
}

// RF14 – Listar todos os hardwares de uma máquina específica
exports.getHardwaresByMaquina = async (req, res) => {
    const { maquinaId } = req.query;

    try {
        const { rows } = await db.query(
            `SELECT 
                h.id AS hardwareID,
                h.nome AS hardwareNome,
                h.estado AS hardwareEstado,
                h.tipo AS hardwareTipo
            FROM hardware h
            WHERE h.idmaquina = $1
            ORDER BY h.nome`,
            [maquinaId]
        );

        res.status(200).send({
            success: true,
            message: "Hardwares consultados com sucesso!",
            data: rows.map((row) => {
                return {
                    hardwareid: row.hardwareid,
                    hardwarenome: row.hardwarenome,
                    hardwareestado: row.hardwareestado,
                    hardwaretipo: row.hardwaretipo,
                }
            })
        });
    } catch (error) {
        console.error("Erro ao buscar hardwares:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao buscar hardwares: " + error.message]
        });
    }
}