const luxon = require("luxon");
const DateTime = luxon.DateTime;

exports.getMostBoughtPacotes = async (req, res) => {
    const { rows } = await db.query(
        `SELECT COUNT(*) as comprados, p.id as pacoteId, p.nome as nomePacote, p.preco as precoPacote
        FROM pacote p 
        JOIN clientepacote cp ON p.id = cp.pacote 
        GROUP BY p.id
        ORDER BY comprados 
        DESC LIMIT 10 
         `
    )

    res.status(200).send({
        success: true,
        message: "Pacotes consultados com sucesso!",
        data: rows.map((row) => {
            return {
                comprados: row.comprados,
                id: row.pacoteId,
                nomePacote: row.nomePacote,
                precoPacote: row.precoPacote
            }
        })
    })
}

const db = require("../config/database");

exports.getAllPacotes = async (req, res) => {
    const { rows } = await db.query(
        "SELECT p.id, p.nome, p.preco, o.tempocomputador, o.tempoconsole, o.temposimulador, pv.tempoadicionar " +
        "FROM pacote p " +
        "LEFT JOIN ordinario o ON (p.id = o.id) " +
        "LEFT JOIN pacotevip pv ON (p.id = pv.id)"
    );

    res.status(200).send({
        success: true,
        message: "Pacotes selecionados com sucesso",
        data: rows
    });
}

exports.getAllClientePacotes = async (req, res) => {
    const { rows } = await db.query(
        "SELECT c.cpf, p.id as pacId, cp.datatempo, c.nome as cliNome, p.nome as pacNome, p.preco, o.tempocomputador, o.tempoconsole, o.temposimulador, pv.tempoadicionar " +
        "FROM clientePacote cp " +
        "INNER JOIN cliente c ON (cp.cliente = c.cpf) " +
        "INNER JOIN pacote p ON (cp.pacote = p.id) " +
        "LEFT JOIN ordinario o ON (cp.pacote = o.id) " +
        "LEFT JOIN pacotevip pv ON (cp.pacote = pv.id) " +
        "ORDER BY datatempo DESC"
    );

    res.status(200).send({
        success: true,
        message: "ClientePacotes selecionados com sucesso",
        data: rows
    });
}

exports.getClientePacote = async (req, res) => {
    if (!req.query.searchParam) {
        res.status(400).send({
            success: false,
            message: "Parâmetro(s) inválido(s)",
        });
    }

    const searchParam = req.query.searchParam;

    const { rows } = await db.query(
        "SELECT c.cpf, p.id, cp.data, c.nome as cliNome, p.nome as pacNome " +
        "FROM clientePacote cp " +
        "JOIN cliente c ON (cp.cliente = c.cpf) " +
        "JOIN pacote p ON (cp.pacote = p.id) " +
        "LEFT JOIN ordinario o ON (cp.pacote = o.id) " +
        "LEFTJOIN pacotevip pv ON (cp.pacote = pv.id) " +
        "WHERE c.cpf = $1 OR c.nome ILIKE $2",
        [searchParam, `%${searchParam}%`]
    );

    if (rows.length == 0) {
        res.status(404).send({
            success: false,
            message: "Nenhum pacote encontrado"
        });
        return;
    }

    res.status(200).send({
        success: true,
        message: "Pacotes(s) encontrado(s)",
        data: rows
    });
}

// enviar do front a "data" já formatada para o banco. Nessa função a data é opcional, se não tiver ele pega a de hoje
exports.createClientePacote = async (req, res) => {
    if (!req.body.cpf || !req.body.pacote) {
        res.status(400).send({
            success: false,
            message: "Valores de inserção inválidos",
        });
        return;
    }

    const cpf = req.body.cpf;
    const pacoteId = req.body.pacote;
    const data = req.body.data ? req.body.data : new Date().toISOString();

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Validar cliente e obter seus dados
        const { rows: clienteRows } = await client.query(
            "SELECT datafimvip, tempocomputador, tempoconsole, temposimulador FROM cliente WHERE cpf = $1;",
            [cpf]
        );

        if (!clienteRows || clienteRows.length === 0) {
            throw {
                success: false,
                message: "Esse cliente não existe"
            };
        }

        const cliente = clienteRows[0];

        // Validar pacote e obter seus dados
        const { rows: pacoteRows } = await client.query(
            "SELECT pacote.id, nome, preco, tempocomputador, tempoconsole, temposimulador, tempoadicionar FROM pacote LEFT JOIN ordinario ON ordinario.id = pacote.id LEFT JOIN pacotevip ON pacotevip.id = pacote.id WHERE pacote.id = $1;",
            [pacoteId]
        );

        if (!pacoteRows || pacoteRows.length === 0) {
            throw {
                success: false,
                message: "Esse pacote não existe"
            };
        }

        const pacote = pacoteRows[0];

        // Atualizar dados do cliente baseado no tipo de pacote
        if (pacote.tempoadicionar) {
            // Adiciona tempo ao vip (dias)
            const clienteTempoVip = cliente.datafimvip 
                ? DateTime.fromJSDate(cliente.datafimvip)
                : DateTime.now();
            
            const novoTempoVip = clienteTempoVip.plus({
                days: Number(pacote.tempoadicionar)
            });

            console.log(novoTempoVip, pacote, cliente.datafimvip)

            await client.query(
                "UPDATE cliente SET datafimvip = $1, vip = true WHERE cpf = $2",
                [novoTempoVip.toJSDate(), cpf]
            );
        }

        if (pacote.tempocomputador) {
            await client.query(
                "UPDATE cliente SET tempocomputador = $1 WHERE cpf = $2",
                [Number(cliente.tempocomputador || 0) + Number(pacote.tempocomputador), cpf]
            );
        }

        if (pacote.tempoconsole) {
            await client.query(
                "UPDATE cliente SET tempoconsole = $1 WHERE cpf = $2",
                [Number(cliente.tempoconsole || 0) + Number(pacote.tempoconsole), cpf]
            );
        }

        if (pacote.temposimulador) {
            await client.query(
                "UPDATE cliente SET temposimulador = $1 WHERE cpf = $2",
                [Number(cliente.temposimulador || 0) + Number(pacote.temposimulador), cpf]
            );
        }

        // Inserir o registro de compra do pacote
        await client.query(
            "INSERT INTO clientePacote (cliente, pacote, datatempo) VALUES ($1, $2, $3)",
            [cpf, pacoteId, data]
        );

        await client.query('COMMIT');

        res.status(200).send({
            success: true,
            message: "Pacote adicionado ao cpf " + cpf + " com sucesso",
        });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar clientePacote:', e);
        return res.status(400).send({
            success: false,
            message: e.message || "Erro ao adicionar pacote"
        });
    } finally {
        client.release();
    }
}

// enviar do front a "data" já formatada para o banco
exports.deleteClientePacote = async (req, res) => {
    if (!req.body.cpf || !req.body.pacote || !req.body.data) {
        res.status(400).send({
            success: false,
            message: "Parâmetros de exclusão inválidos",
        });
    }

    const cpf = req.body.cpf;
    const pacote = req.body.pacote;
    const data = req.body.data;

    const result = await db.query("DELETE FROM clientePacote WHERE cliente = $1 AND pacote = $2 AND data = $3", [cpf, pacote, data]);

    if (result.rowCount === 0) {
        res.status(404).send({
            success: false,
            message: "Pacote do cliente não encontrado para exclusão",
        });
        return;
    }

    res.status(200).send({
        success: true,
        message: "Pacote do cliente excluído com sucesso",
    });
}