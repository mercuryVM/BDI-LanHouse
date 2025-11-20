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