const db = require("../config/database");

exports.getManutencao = async (req, res) => {
    const { id } = req.query;
    const { rows } = await db.query(
        `SELECT 
            m.id AS manutencaoID,
            m.tipo AS manutencaoTipo,
            m.prioridade AS manutencaoPrioridade,
            a.datatempoinicio AS manutencaodatatempoinicio,
            maq.id AS maquinaID, 
            p.nome as nomePlat, 
            p.tipo as tipoPlat,
            f.nome as nomeFuncionario
        FROM manutencao m 
        LEFT JOIN agendamento a ON m.id = a.id 
        LEFT JOIN manutencaomaquina manMaq ON m.id = manMaq.idmanutencao
        JOIN maquina maq ON manMaq.idmaquina = maq.id
        JOIN plataforma p ON maq.nomeplat = p.nome
        JOIN funcionario f ON a.agendadopor = f.cpf
        WHERE m.id = $1`,
        [id]
    );
    const manutencao = rows[0];

    if (!manutencao) {
        return res.status(404).send({
            success: false,
            errors: ["Manutenção não encontrada!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Manutenção consultada com sucesso!",
        data: {
            manutencao: {
                manutencaoID: manutencao.manutencaoID,
                manutencaoTipo: manutencao.manutencaoTipo,
                manutecaoPrioridade: manutencao.manutecaoPrioridade,
                manutencaodatatempoinicio: manutencao.manutencaodatatempoinicio,
                maquinaID: manutencao.maquinaID,
                nomePlat: manutencao.nomePlat,
                tipoPlat: manutencao.tipoPlat,
                nomeFuncionario: manutencao.nomeFuncionario,
            }
        },
    });
}

exports.getManutencoes = async (req, res) => {
    const { prioridade, tipo, periodo } = req.query;
    const params = [];
    let paramCount = 0;

    let query = `SELECT 
            m.id AS manutencaoID,
            m.tipo AS manutencaoTipo,
            m.prioridade AS manutencaoPrioridade,
            a.datatempoinicio AS manutencaodatatempoinicio,
            maq.id AS maquinaID, 
            p.nome as nomePlat, 
            p.tipo as tipoPlat,
            f.nome as nomeFuncionario
        FROM manutencao m 
        LEFT JOIN agendamento a ON m.id = a.id 
        LEFT JOIN manutencaomaquina manMaq ON m.id = manMaq.idmanutencao
        JOIN maquina maq ON manMaq.idmaquina = maq.id
        JOIN plataforma p ON maq.nomeplat = p.nome
        JOIN funcionario f ON a.agendadopor = f.cpf
        WHERE 1=1`;

    if (prioridade) {
        paramCount++;
        query += ` AND m.prioridade = $${paramCount}`;
        params.push(prioridade);
    }

    if (tipo) {
        paramCount++;
        query += ` AND m.tipo = $${paramCount}`;
        params.push(tipo);
    }

    if (periodo) {
        const dias = parseInt(periodo);
        if (!isNaN(dias) && dias > 0) {
            paramCount++;
            query += ` AND a.datatempoinicio::date BETWEEN CURRENT_DATE AND CURRENT_DATE + $${paramCount}::INTERVAL`;
            params.push(`${dias} days`);
        }
    }

    query += " ORDER BY a.datatempoinicio NULLS FIRST";

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Nenhuma manutenção encontrada!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Manutencões consultadas com sucesso!",
        data: rows.map((row) => {
            return {
                manutencaoID: row.manutencaoID,
                manutencaoTipo: row.manutencaoTipo,
                manutecaoPrioridade: row.manutecaoPrioridade,
                manutencaodatatempoinicio: row.manutencaodatatempoinicio,
                maquinaID: row.maquinaID,
                nomePlat: row.nomePlat,
                tipoPlat: row.tipoPlat,
                nomeFuncionario: row.nomeFuncionario,
            }
        })

    });
};

exports.getManutencoesHardware = async (req, res) => {
    const { id } = req.query;
    const { rows } = await db.query(
        `SELECT 
            h.id AS hardwareID,
            h.nome AS hardwareNome,
            h.estado AS hardwareEstado,
            h.tipo AS hardwareTipo,
            maq.id AS maquinaID, 
            p.nome as nomePlat, 
            p.tipo as tipoPlat

        FROM manutencaomaquina manMaq
        JOIN hardware h ON manMaq.idhardware = h.id
        JOIN maquina maq ON h.idmaquina = maq.id
        JOIN plataforma p ON maq.nomeplat = p.nome
        WHERE h.id = $1`,
        [id]
    );

    if (rows.length === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Nenhum hardware em manutenção encontrado!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Hardwares em manutenção consultados com sucesso!",
        data: rows.map((row) => {
            return {
                hardwareID: row.hardwareID,
                hardwareNome: row.hardwareNome,
                hardwareEstado: row.hardwareEstado,
                hardwareTipo: row.hardwareTipo,
                maquinaID: row.maquinaID,
                nomePlat: row.nomePlat,
                tipoPlat: row.tipoPlat,
            }
        })
    });
}