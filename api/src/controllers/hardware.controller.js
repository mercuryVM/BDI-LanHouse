const db = require("../config/database");

// Listar todos os hardwares com filtros
exports.getAllHardwares = async (req, res) => {
    const { tipo, estado, disponivel } = req.query;
    const params = [];
    let paramCount = 0;

    let query = `SELECT 
        h.id as hardwareid,
        h.nome as hardwarenome,
        h.tipo as hardwaretipo,
        h.estado as hardwareestado,
        h.idmaquina as maquinaid,
        m.nomeplat as nomeplat,
        p.tipo as tipoplat
    FROM hardware h
    LEFT JOIN maquina m ON h.idmaquina = m.id
    LEFT JOIN plataforma p ON m.nomeplat = p.nome
    WHERE 1=1`;

    // Filtro por tipo
    if (tipo) {
        paramCount++;
        query += ` AND h.tipo = $${paramCount}`;
        params.push(tipo);
    }

    // Filtro por estado
    if (estado) {
        paramCount++;
        query += ` AND h.estado = $${paramCount}`;
        params.push(estado);
    }

    // Filtro por disponibilidade (em estoque ou em uso)
    if (disponivel === 'true') {
        query += ` AND h.idmaquina IS NULL`;
    } else if (disponivel === 'false') {
        query += ` AND h.idmaquina IS NOT NULL`;
    }

    query += ` ORDER BY h.idmaquina DESC, h.nome`;

    try {
        const { rows } = await db.query(query, params);

        res.status(200).send({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Erro ao buscar hardwares:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao buscar hardwares: " + error.message]
        });
    }
};

// Obter estatísticas do estoque
exports.getEstoqueStats = async (req, res) => {
    try {
        // Estatísticas gerais
        const statsResult = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN idmaquina IS NULL THEN 1 END) as disponiveis,
                COUNT(CASE WHEN idmaquina IS NOT NULL THEN 1 END) as em_uso
            FROM hardware
        `);

        // Estatísticas por estado (dinâmico)
        const estadosResult = await db.query(`
            SELECT 
                estado,
                COUNT(*) as quantidade
            FROM hardware
            WHERE estado IS NOT NULL
            GROUP BY estado
            ORDER BY quantidade DESC
        `);

        // Estatísticas por tipo (dinâmico)
        const tiposResult = await db.query(`
            SELECT 
                tipo,
                COUNT(*) as quantidade
            FROM hardware
            WHERE tipo IS NOT NULL
            GROUP BY tipo
            ORDER BY quantidade DESC
        `);

        res.status(200).send({
            success: true,
            data: {
                ...statsResult.rows[0],
                porEstado: estadosResult.rows,
                porTipo: tiposResult.rows
            }
        });
    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao buscar estatísticas: " + error.message]
        });
    }
};

// Criar novo hardware
exports.createHardware = async (req, res) => {
    const { nome, tipo, estado } = req.body;

    try {
        // Buscar o próximo ID disponível
        const maxIdResult = await db.query(
            `SELECT COALESCE(MAX(id), 0) + 1 as nextid FROM hardware`
        );
        const nextId = maxIdResult.rows[0].nextid;

        // Inserir com o ID gerado manualmente
        const { rows } = await db.query(
            `INSERT INTO hardware (id, nome, tipo, estado, idmaquina)
            VALUES ($1, $2, $3, $4, NULL)
            RETURNING id as hardwareid, nome as hardwarenome, tipo as hardwaretipo, estado as hardwareestado, idmaquina as maquinaid`,
            [nextId, nome, tipo, estado || 'ativo']
        );

        res.status(201).send({
            success: true,
            message: "Hardware criado com sucesso!",
            data: rows[0]
        });
    } catch (error) {
        console.error("Erro ao criar hardware:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao criar hardware: " + error.message]
        });
    }
};

// Atualizar hardware
exports.updateHardware = async (req, res) => {
    const { id } = req.query;
    const { nome, tipo, estado } = req.body;

    try {
        const fields = [];
        const values = [];
        let paramCount = 0;

        if (nome) {
            paramCount++;
            fields.push(`nome = $${paramCount}`);
            values.push(nome);
        }
        if (tipo) {
            paramCount++;
            fields.push(`tipo = $${paramCount}`);
            values.push(tipo);
        }
        if (estado) {
            paramCount++;
            fields.push(`estado = $${paramCount}`);
            values.push(estado);
        }

        if (fields.length === 0) {
            return res.status(400).send({
                success: false,
                errors: ["Nenhum campo para atualizar"]
            });
        }

        paramCount++;
        values.push(id);

        const { rows } = await db.query(
            `UPDATE hardware SET ${fields.join(', ')} WHERE id = $${paramCount} 
            RETURNING id as hardwareid, nome as hardwarenome, tipo as hardwaretipo, estado as hardwareestado, idmaquina as maquinaid`,
            values
        );

        if (rows.length === 0) {
            return res.status(404).send({
                success: false,
                errors: ["Hardware não encontrado"]
            });
        }

        res.status(200).send({
            success: true,
            message: "Hardware atualizado com sucesso!",
            data: rows[0]
        });
    } catch (error) {
        console.error("Erro ao atualizar hardware:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao atualizar hardware: " + error.message]
        });
    }
};

// Deletar hardware
exports.deleteHardware = async (req, res) => {
    const { id } = req.query;

    try {
        // Verificar se o hardware está em uso
        const checkResult = await db.query(
            `SELECT idmaquina FROM hardware WHERE id = $1`,
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).send({
                success: false,
                errors: ["Hardware não encontrado"]
            });
        }

        if (checkResult.rows[0].idmaquina !== null) {
            return res.status(400).send({
                success: false,
                errors: ["Não é possível deletar hardware que está em uso. Remova-o da máquina primeiro."]
            });
        }

        await db.query(`DELETE FROM hardware WHERE id = $1`, [id]);

        res.status(200).send({
            success: true,
            message: "Hardware deletado com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao deletar hardware:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao deletar hardware: " + error.message]
        });
    }
};

// Obter tipos de hardware disponíveis
exports.getTiposHardware = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT DISTINCT tipo FROM hardware WHERE tipo IS NOT NULL ORDER BY tipo`
        );

        res.status(200).send({
            success: true,
            data: rows.map(r => r.tipo)
        });
    } catch (error) {
        console.error("Erro ao buscar tipos:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao buscar tipos: " + error.message]
        });
    }
};

// Obter estados de hardware disponíveis
exports.getEstadosHardware = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT DISTINCT estado FROM hardware WHERE estado IS NOT NULL ORDER BY estado`
        );

        res.status(200).send({
            success: true,
            data: rows.map(r => r.estado)
        });
    } catch (error) {
        console.error("Erro ao buscar estados:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao buscar estados: " + error.message]
        });
    }
};
