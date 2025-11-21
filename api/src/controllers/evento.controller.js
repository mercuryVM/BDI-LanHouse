const db = require("../config/database");

// Listar todos os eventos
exports.getEventos = async (req, res) => {
    try {
        const query = `
            SELECT 
                e.id AS eventoid,
                e.nome AS eventonome,
                e.status AS eventostatus,
                a.datatempoinicio AS eventodatatempoinicio,
                a.datatempofim AS eventodatatempofim,
                f.nome AS nomefuncionario,
                f.cpf AS cpffuncionario
            FROM evento e
            LEFT JOIN agendamento a ON e.id = a.id
            JOIN funcionario f ON a.agendadopor = f.cpf
            ORDER BY a.datatempoinicio DESC`;

        const { rows } = await db.query(query);

        if (rows.length === 0) {
            return res.status(404).send({
                success: false,
                errors: ["Nenhum evento encontrado!"],
            });
        }

        // Para cada evento, buscar máquinas e clientes associados
        const eventosComDetalhes = await Promise.all(rows.map(async (evento) => {
            // Buscar máquinas do evento
            const maquinasResult = await db.query(
                `SELECT DISTINCT
                    m.id AS maquinaid,
                    m.nomeplat,
                    p.tipo as tipoplat
                FROM eventomaquina em
                JOIN maquina m ON em.maquina = m.id
                JOIN plataforma p ON m.nomeplat = p.nome
                WHERE em.evento = $1`,
                [evento.eventoid]
            );

            // Buscar clientes do evento
            const clientesResult = await db.query(
                `SELECT DISTINCT
                    c.cpf AS clientecpf,
                    c.nome AS clientenome
                FROM evento e
                JOIN cliente c ON e.cliente = c.cpf
                WHERE e.id = $1`,
                [evento.eventoid]
            );

            return {
                eventoid: evento.eventoid,
                eventonome: evento.eventonome,
                eventodatatempoinicio: evento.eventodatatempoinicio,
                eventodatatempofim: evento.eventodatatempofim,
                eventostatus: evento.eventostatus,
                nomefuncionario: evento.nomefuncionario,
                cpffuncionario: evento.cpffuncionario,
                maquinas: maquinasResult.rows.map(m => ({
                    maquinaid: m.maquinaid,
                    nomeplat: m.nomeplat,
                    tipoplat: m.tipoplat
                })),
                cliente: clientesResult.rows.length > 0 ? {
                    cpf: clientesResult.rows[0].clientecpf,
                    nome: clientesResult.rows[0].clientenome
                } : null
            };
        }));

        res.status(200).send({
            success: true,
            message: "Eventos consultados com sucesso!",
            data: eventosComDetalhes
        });
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao buscar eventos: " + error.message]
        });
    }
};

// Criar evento
exports.createEvento = async (req, res) => {
    const {
        nome,
        datatempoinicio,
        datatempofim,
        status,
        clienteCpf,
        maquinaIds,
        agendadoPor // CPF do funcionário que está criando o evento
    } = req.body;

    try {
        // Validar intersecção de datas para cada máquina
        if (maquinaIds && maquinaIds.length > 0) {
            for (const maquinaId of maquinaIds) {
                const conflictCheck = await db.query(
                    `SELECT e.nome, a.datatempoinicio, a.datatempofim
                    FROM evento e
                    JOIN agendamento a ON e.id = a.id
                    JOIN eventomaquina em ON e.id = em.evento
                    WHERE em.maquina = $1
                    AND a.datatempoinicio < $2
                    AND (a.datatempofim IS NULL OR a.datatempofim > $3)`,
                    [maquinaId, datatempofim || '9999-12-31', datatempoinicio]
                );

                if (conflictCheck.rows.length > 0) {
                    const conflict = conflictCheck.rows[0];
                    return res.status(400).send({
                        success: false,
                        errors: [`Máquina ID ${maquinaId} já está agendada para o evento "${conflict.nome}" no período selecionado`]
                    });
                }

                // Verificar também conflitos com manutenções
                const maintenanceCheck = await db.query(
                    `SELECT m.tipo, a.datatempoinicio, a.datatempofim
                    FROM manutencao m
                    JOIN agendamento a ON m.id = a.id
                    JOIN manutencaomaquina mm ON m.id = mm.idmanutencao
                    WHERE mm.idmaquina = $1
                    AND a.datatempoinicio < $2
                    AND (a.datatempofim IS NULL OR a.datatempofim > $3)`,
                    [maquinaId, datatempofim || '9999-12-31', datatempoinicio]
                );

                if (maintenanceCheck.rows.length > 0) {
                    const maintenance = maintenanceCheck.rows[0];
                    return res.status(400).send({
                        success: false,
                        errors: [`Máquina ID ${maquinaId} está em manutenção (${maintenance.tipo}) no período selecionado`]
                    });
                }
            }
        }

        // Buscar o próximo ID do agendamento manualmente
        const nextIdResult = await db.query(
            `SELECT COALESCE(MAX(id), 0) + 1 AS nextid FROM agendamento`
        );
        const agendamentoId = nextIdResult.rows[0].nextid;

        // Criar agendamento primeiro com ID manual
        await db.query(
            `INSERT INTO agendamento (id, datatempoinicio, datatempofim, agendadopor)
            VALUES ($1, $2, $3, $4)`,
            [agendamentoId, datatempoinicio, datatempofim || null, agendadoPor]
        );

        // Criar evento com o mesmo ID do agendamento
        const eventoResult = await db.query(
            `INSERT INTO evento (id, nome, status, cliente)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [agendamentoId, nome || null, status || 'Agendado', clienteCpf]
        );

        const eventoId = eventoResult.rows[0].id;

        // Associar máquinas ao evento
        if (maquinaIds && maquinaIds.length > 0) {
            for (const maquinaId of maquinaIds) {
                await db.query(
                    `INSERT INTO eventomaquina (evento, maquina)
                    VALUES ($1, $2)`,
                    [eventoId, maquinaId]
                );
            }
        }

        res.status(201).send({
            success: true,
            message: "Evento criado com sucesso!",
            data: { id: eventoId }
        });
    } catch (error) {
        console.error("Erro ao criar evento:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao criar evento: " + error.message]
        });
    }
};

// Atualizar evento
exports.updateEvento = async (req, res) => {
    const { id } = req.query;
    const {
        nome,
        datatempoinicio,
        datatempofim,
        status,
        clienteCpf,
        maquinaIds
    } = req.body;

    try {
        // Se houver mudança de datas ou máquinas, validar intersecções
        if ((datatempoinicio !== undefined || datatempofim !== undefined || maquinaIds !== undefined)) {
            // Buscar dados atuais do evento
            const currentEvent = await db.query(
                `SELECT a.datatempoinicio, a.datatempofim
                FROM evento e
                JOIN agendamento a ON e.id = a.id
                WHERE e.id = $1`,
                [id]
            );

            const inicio = datatempoinicio || currentEvent.rows[0].datatempoinicio;
            const fim = datatempofim !== undefined ? datatempofim : currentEvent.rows[0].datatempofim;

            // Buscar máquinas atuais ou usar as novas
            let maquinasToCheck = maquinaIds;
            if (!maquinasToCheck) {
                const currentMachines = await db.query(
                    `SELECT maquina FROM eventomaquina WHERE evento = $1`,
                    [id]
                );
                maquinasToCheck = currentMachines.rows.map(r => r.maquina);
            }

            // Validar cada máquina
            if (maquinasToCheck && maquinasToCheck.length > 0) {
                for (const maquinaId of maquinasToCheck) {
                    const conflictCheck = await db.query(
                        `SELECT e.nome, a.datatempoinicio, a.datatempofim
                        FROM evento e
                        JOIN agendamento a ON e.id = a.id
                        JOIN eventomaquina em ON e.id = em.evento
                        WHERE em.maquina = $1
                        AND e.id != $2
                        AND a.datatempoinicio < $3
                        AND (a.datatempofim IS NULL OR a.datatempofim > $4)`,
                        [maquinaId, id, fim || '9999-12-31', inicio]
                    );

                    if (conflictCheck.rows.length > 0) {
                        const conflict = conflictCheck.rows[0];
                        return res.status(400).send({
                            success: false,
                            errors: [`Máquina ID ${maquinaId} já está agendada para o evento "${conflict.nome}" no período selecionado`]
                        });
                    }

                    const maintenanceCheck = await db.query(
                        `SELECT m.tipo, a.datatempoinicio, a.datatempofim
                        FROM manutencao m
                        JOIN agendamento a ON m.id = a.id
                        JOIN manutencaomaquina mm ON m.id = mm.idmanutencao
                        WHERE mm.idmaquina = $1
                        AND a.datatempoinicio < $2
                        AND (a.datatempofim IS NULL OR a.datatempofim > $3)`,
                        [maquinaId, fim || '9999-12-31', inicio]
                    );

                    if (maintenanceCheck.rows.length > 0) {
                        const maintenance = maintenanceCheck.rows[0];
                        return res.status(400).send({
                            success: false,
                            errors: [`Máquina ID ${maquinaId} está em manutenção (${maintenance.tipo}) no período selecionado`]
                        });
                    }
                }
            }
        }

        // Atualizar evento
        const eventoFields = [];
        const eventoValues = [];
        let paramCount = 0;

        if (nome !== undefined) {
            paramCount++;
            eventoFields.push(`nome = $${paramCount}`);
            eventoValues.push(nome);
        }
        if (status !== undefined) {
            paramCount++;
            eventoFields.push(`status = $${paramCount}`);
            eventoValues.push(status);
        }
        if (clienteCpf !== undefined) {
            paramCount++;
            eventoFields.push(`cliente = $${paramCount}`);
            eventoValues.push(clienteCpf);
        }

        if (eventoFields.length > 0) {
            paramCount++;
            eventoValues.push(id);
            await db.query(
                `UPDATE evento SET ${eventoFields.join(', ')} WHERE id = $${paramCount}`,
                eventoValues
            );
        }

        // Atualizar agendamento
        if (datatempoinicio !== undefined || datatempofim !== undefined) {
            const agendamentoFields = [];
            const agendamentoValues = [];
            let agendamentoParamCount = 0;

            if (datatempoinicio !== undefined) {
                agendamentoParamCount++;
                agendamentoFields.push(`datatempoinicio = $${agendamentoParamCount}`);
                agendamentoValues.push(datatempoinicio);
            }
            if (datatempofim !== undefined) {
                agendamentoParamCount++;
                agendamentoFields.push(`datatempofim = $${agendamentoParamCount}`);
                agendamentoValues.push(datatempofim);
            }

            if (agendamentoFields.length > 0) {
                agendamentoParamCount++;
                agendamentoValues.push(id);
                await db.query(
                    `UPDATE agendamento SET ${agendamentoFields.join(', ')} WHERE id = $${agendamentoParamCount}`,
                    agendamentoValues
                );
            }
        }

        // Atualizar máquinas associadas
        if (maquinaIds !== undefined) {
            // Remove todas as associações existentes
            await db.query(`DELETE FROM eventomaquina WHERE evento = $1`, [id]);

            // Adiciona as novas associações
            if (maquinaIds.length > 0) {
                for (const maquinaId of maquinaIds) {
                    await db.query(
                        `INSERT INTO eventomaquina (evento, maquina)
                        VALUES ($1, $2)`,
                        [id, maquinaId]
                    );
                }
            }
        }

        res.status(200).send({
            success: true,
            message: "Evento atualizado com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao atualizar evento:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao atualizar evento: " + error.message]
        });
    }
};

// Deletar evento
exports.deleteEvento = async (req, res) => {
    const { id } = req.query;

    try {
        // Remove associações com máquinas
        await db.query(`DELETE FROM eventomaquina WHERE evento = $1`, [id]);

        // Remove evento
        await db.query(`DELETE FROM evento WHERE id = $1`, [id]);

        // Remove agendamento
        await db.query(`DELETE FROM agendamento WHERE id = $1`, [id]);

        res.status(200).send({
            success: true,
            message: "Evento deletado com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao deletar evento:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao deletar evento: " + error.message]
        });
    }
};
