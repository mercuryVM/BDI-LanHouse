const db = require("../config/database");

exports.getAllPacotes = async(req, res) => {
    const {rows} =  await db.query("SELECT * FROM pacote");
    
    res.status(200).send({
        success: true,
        message: "Pacotes selecionados com sucesso",
        data: rows
    });
}

exports.getClientePacote = async(req, res) => {
    if(!req.query.searchParam){
        res.status(400).send({
            success: false,
            message: "Parâmetro(s) inválido(s)",
        });
    }

    const searchParam = req.query.searchParam;

    const {rows} = await db.query(
        "SELECT c.cpf, p.id, cp.data, c.nome as cliNome, p.nome as pacNome " +
            "FROM clientePacote cp " +
            "JOIN cliente c ON (cp.cliente = c.cpf) " +
            "JOIN pacote p ON (cp.pacote = p.id) " +
        "WHERE c.cpf = $1 OR c.nome ILIKE $2",
        [searchParam, `%${searchParam}%`]
    );

    if(rows.length == 0){
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
exports.createClientePacote = async(req, res) => {
    if(!req.body.cpf || !req.body.pacote){
        res.status(400).send({
            success: false,
            message: "Valores de inserção inválidos",
        });
    }

    const cpf = req.body.cpf;
    const pacote = req.body.pacote;
    const data = req.body.data ? req.body.data : new Date().toISOString().split('T')[0];

    const {rows} = await db.query("SELECT nome FROM cliente WHERE cpf = $1;", [cpf]);

    if(!rows){
        res.status(404).send({
            success: false,
            message: "Esse cliente não existe"
        });
        return;
    }

    await db.query("INSERT INTO clientePacote VALUES ($1, $2, $3)", [cpf, pacote, data]);

    res.status(200).send({
        success: true,
        message: "Pacote adicionado ao cpf " + cpf + " com sucesso",
    });
}

// enviar do front a "data" já formatada para o banco
exports.deleteClientePacote = async(req, res) => {
    if(!req.body.cpf || !req.body.pacote || !req.body.data){
        res.status(400).send({
            success: false,
            message: "Parâmetros de exclusão inválidos",
        });
    }

    const cpf = req.body.cpf;
    const pacote = req.body.pacote;
    const data = req.body.data;

    const result = await db.query("DELETE FROM clientePacote WHERE cliente = $1 AND pacote = $2 AND data = $3", [cpf, pacote, data]);

    if(result.rowCount === 0){
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