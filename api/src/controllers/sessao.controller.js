const db = require("../config/database");

// RF06 – Gerenciar sessões ativas e finalizadas
// • Filtrar por data, duração, máquina, cliente, sessão ativa/inativa
// • “ontem, hoje, semana passada...” podem ser enviados pelo front via datatempoinicio
// RF04 – Sessão contém horário inicial
// RF05 – Sessão contém horário final (quando aplicável)
// RF11 – Apoia consultas de frequência, total de sessões etc. via filtro de cliente
exports.getSessoes = async (req, res) => {
    const { cliente, datatempoinicio, duracao, maquina, ativa } = req.query;
    const params = [];
    let paramCount = 0;
    // RF06 – Consulta completa de sessões com JOIN cliente e máquina
    let query = "SELECT * FROM sessao JOIN cliente ON cliente = cpf JOIN maquina ON maquina.id = sessao.maquina WHERE 1=1";

    // RF06 – filtro por cliente (CPF)
    // RF11 – usado para análises do histórico do cliente
    if (cliente) {
        paramCount++;
        query += ` AND cliente = $${paramCount}`;
        params.push(cliente);
    }
    // RF06 – filtro por horário inicial
    if (datatempoinicio) {
        paramCount++;
        query += ` AND datatempoinicio = $${paramCount}`;
        params.push(datatempoinicio);
    }

    if (duracao) {
        paramCount++;
        query += ` AND (datatempofim - datatempoinicio) = $${paramCount}::interval`;
        params.push(`${duracao} minutes`);
    }
    // RF06 – filtro por máquina específica
    if (maquina) {
        paramCount++;
        query += ` AND maquina = $${paramCount}`;
        params.push(maquina);
    }

    // RF06 – filtro por sessão ativa/inativa
    // ativa = true → sem datatempofim
    // ativa = false → possui datatempofim
    // RF05 – Sessões podem ser pausadas/terminadas (datatempofim indica desligamento)
    if (ativa !== undefined) {
        if (ativa === 'true' || ativa === true) {
            query += ` AND datatempofim IS NULL`;
        } else {
            query += ` AND datatempofim IS NOT NULL`;
        }
    }
    // RF06 – ordenação: sessões ativas primeiro, depois encerradas
    query += " ORDER BY datatempofim NULLS FIRST";

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Nenhuma sessão encontrada!"],
        });
    }

    // RF04 – retorna horário inicial
    // RF05 – retorna horário final e motivo do término
    // RF06 – retorna dados completos da sessão + máquina e cliente
    res.status(200).send({
        success: true,
        message: "Sessões consultadas com sucesso!",
        data: rows.map((row) => {
            return {
                id: row.id,
                cliente: {
                    cpf: row.cliente,
                    nome: row.nome,
                },
                datatempoinicio: row.datatempoinicio,
                datatempofim: row.datatempofim,
                motivotermino: row.motivotermino,
                maquina: {
                    id: row.maquina,
                    lastseen: row.lastseen,
                    nomeplat: row.nomeplat
                }
            }
        })

    });
};