const db = require("../config/database");

exports.getAllComandas = async(req, res) => {
    const linhaQuery = 
    "SELECT co.id, co.data, co.emissao as cpfFuncionario, f.nome AS nomeFuncionario, cl.cpf as cpfcliente, cl.nome AS nomecliente," +
    "    (" +
    "        SELECT COALESCE(SUM(cp.quantidade * p.preco), 0) " +
    "        FROM comandaProduto cp " +
    "        JOIN produto p ON cp.produto = p.id " +
    "        WHERE cp.comanda = co.id" +
    "    ) AS total " +
    "FROM comanda co " +
    "    JOIN cliente cl ON (cl.cpf = co.cliente) " +
    "    JOIN clt ON (clt.cpf = co.emissao) " +
    "    JOIN funcionario f ON (f.cpf = clt.cpf) ";
        
    const {rows} =  await db.query(linhaQuery);
    
    res.status(200).send({
        success: true,
        message: "Comandas selecionados com sucesso",
        data: rows
    });
}

exports.getComanda = async(req, res) => {
    if(!req.query.searchParam){
        res.status(400).send({
            success: false,
            message: "Parâmetro(s) inválido(s)",
        });
    }

    const searchParam = req.query.searchParam;
    const hoje = req.query.hoje;

    let linhaQuery = (
        "SELECT co.id, co.data, co.emissao as cpfFuncionario, f.nome AS nomeFuncionario, cl.cpf as cpfcliente, cl.nome AS nomecliente," +        "    (" +
        "        SELECT COALESCE(SUM(cp.quantidade * p.preco), 0) " +
        "        FROM comandaProduto cp " +
        "        JOIN produto p ON cp.produto = p.id " +
        "        WHERE cp.comanda = co.id" +
        "    ) AS total " +
        "FROM comanda co " +
        "    JOIN cliente cl ON (cl.cpf = co.cliente) " +
        "    JOIN clt ON (clt.cpf = co.emissao) " +
        "    JOIN funcionario f ON (f.cpf = clt.cpf) " +
        "WHERE (cl.cpf = $1 OR cl.nome ILIKE $2 OR co.id = $1) "
    );

    if(Boolean(hoje)){
        const date = new Date().toISOString().split('T')[0];
        const datequery = `AND co.data = '${date}'`;
        linhaQuery = linhaQuery + datequery;
    }

    const {rows} = await db.query(
        linhaQuery, [searchParam, `%${searchParam}%`]
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

exports.abrirComandaDoCliente = async(req, res) => {
    if(!req.body.cliente || !req.body.funcionario){
        res.status(400).send({
            success: false,
            message: "Valores de inserção inválidos",
        });
    }

    const cliente = req.body.cliente;
    const funcionario = req.body.funcionario;
    const dataHoje = new Date().toISOString().split('T')[0];

    // se ja existe uma comanda para esse cliente que ainda não foi paga, nao cria outra, usa essa
    let result = await db.query("SELECT id FROM comanda WHERE cliente=$1 AND fechada=false", [cliente]);

    if(result.rowCount > 0){
        res.status(200).send({
            success: true,
            message: "Comanda já estava aberta",
            data: result.rows 
        });
        return;
    }

    // cria a comanda e pega o id dela, devolve pro front
    result = await db.query("INSERT INTO comanda (data, emissao, cliente, fechada) VALUES ($1, $2, $3, false) RETURNING id", [dataHoje, funcionario, cliente]);

    res.status(200).send({
        success: true,
        message: "Comanda aberta com sucesso",
        data: result.rows 
    });
}

exports.adicionarProdutoNaComanda = async(req, res) => {
    const comanda = req.body.comanda;
    const produto = req.body.produto;
    const quantidade = req.body.quantidade;
    
    if(!comanda || !produto || !quantidade){
        res.status(400).send({
            success: false,
            message: "Parâmetros inválidos",
        });
    }
    
    const result = await db.query("SELECT quantidade FROM comandaProduto WHERE comanda=$1 AND produto=$2", [comanda, produto]);
    if(result.rowCount){
        const novaQtd = parseFloat(result.rows[0].quantidade) + parseFloat(quantidade);

        await db.query("UPDATE comandaProduto SET quantidade=$1 WHERE comanda=$2 AND produto=$3", [novaQtd, comanda, produto]);
            res.status(200).send({
            success: true,
            message: "Produto somado a comanda"
        });
        return;
    }

    await db.query("INSERT INTO comandaProduto VALUES ($1, $2, $3)", [comanda, produto, quantidade]);

    res.status(200).send({
        success: true,
        message: "Produto adicionado a comanda",
    });
}

exports.fecharComandaDoCliente = async(req, res) => {
    const comanda = req.body.comanda;
    
    if(!comanda){
        res.status(400).send({
            success: false,
            message: "Parâmetros inválidos",
        });
    }

    await db.query("UPDATE comanda SET fechada = true WHERE id=$1", [comanda]);
    res.status(200).send({
        success: true,
        message: "Comanda fechada",
    });
}