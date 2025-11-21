const db = require("../config/database");

// RF01 – Gerenciar disponibilidade de máquinas por plataforma e status
// RF10 – Configurar/monitorar status da máquina (livre, ocupada, manutenção, offline) via lastseen
// (mantém um “heartbeat” da máquina para saber se está ativa/online)
exports.pingMaquina = async (req, res) => {
    const id = req.body.id;

    // RF01 / RF10 – Atualiza lastseen da máquina, usado para saber se ela está disponível/operacional
    await db.query(
        "UPDATE maquina SET lastseen = $1 WHERE id = $2",
        [new Date(), id]
    );

    res.status(200).send({
        success: true,
    });
}

// RF17 – Relatórios e estatísticas: máquinas mais utilizadas
// • Atende ao item “máquinas mais utilizadas” na seção de relatórios
// • Usa contagem de sessões por máquina para gerar ranking TOP 10
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


// RF01 – Gerenciar disponibilidade de máquinas por plataforma e status
// RF10 – Base para configurar e visualizar status da máquina
// RF13 – Apoio para bloqueio de máquinas em manutenção/offline (status pode ser derivado daqui)
exports.getAllMaquinas = async (req, res) => {
    const { rows } = await db.query(
        "SELECT * FROM maquina LEFT JOIN Plataforma ON maquina.nomeplat = Plataforma.nome ORDER BY lastseen DESC"
    );
    // RF01 / RF10 – Retorna todas as máquinas, já com sua plataforma e ordenadas por atividade recente
    res.status(200).send({
        success: true,
        data: rows
    });
}

// RF14 – Gerenciar máquinas com mais registros de defeitos
// • “máquinas com mais registros de defeitos / mais manutenções”
// • Usado para identificar máquinas problemáticas e possíveis pontos de falha recorrente
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

// Listar hardwares disponíveis no estoque (sem máquina)
exports.getHardwaresDisponiveis = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT 
                id,
                nome,
                estado,
                tipo
            FROM hardware
            WHERE idmaquina IS NULL
            ORDER BY nome`
        );

        res.status(200).send({
            success: true,
            message: "Hardwares disponíveis consultados com sucesso!",
            data: rows.map((row) => ({
                hardwareid: row.id,
                hardwarenome: row.nome,
                hardwareestado: row.estado,
                hardwaretipo: row.tipo
            }))
        });
    } catch (error) {
        console.error("Erro ao buscar hardwares disponíveis:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao buscar hardwares disponíveis: " + error.message]
        });
    }
}

// Adicionar hardware a uma máquina (vincula um hardware do estoque)
exports.addHardwareToMaquina = async (req, res) => {
    const { maquinaId, hardwareId } = req.body;

    try {
        // Verifica se o hardware existe e está disponível
        const checkResult = await db.query(
            `SELECT * FROM hardware WHERE id = $1 AND idmaquina IS NULL`,
            [hardwareId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(400).send({
                success: false,
                errors: ["Hardware não encontrado ou já está em uso"]
            });
        }

        // Atualiza o hardware para vincular à máquina
        const { rows } = await db.query(
            `UPDATE hardware SET idmaquina = $1 WHERE id = $2 RETURNING *`,
            [maquinaId, hardwareId]
        );

        res.status(200).send({
            success: true,
            message: "Hardware adicionado à máquina com sucesso!",
            data: rows[0]
        });
    } catch (error) {
        console.error("Erro ao adicionar hardware:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao adicionar hardware: " + error.message]
        });
    }
}

// Remover hardware de uma máquina (define idmaquina como NULL)
exports.removeHardwareFromMaquina = async (req, res) => {
    const { hardwareId } = req.body;

    try {
        await db.query(
            `UPDATE hardware SET idmaquina = NULL WHERE id = $1`,
            [hardwareId]
        );

        res.status(200).send({
            success: true,
            message: "Hardware removido da máquina com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao remover hardware:", error);
        res.status(500).send({
            success: false,
            errors: ["Erro ao remover hardware: " + error.message]
        });
    }
}