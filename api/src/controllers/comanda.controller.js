const db = require("../config/database");

// RF09 – Listar comandas consolidadas
// (Mostra comandas com cliente, funcionário emissor e total consumido)
exports.getAllComandas = async(req, res) => {
    const linhaQuery = 
    "SELECT co.id, co.data, co.fechada, co.emissao as cpfFuncionario, f.nome AS nomeFuncionario, cl.cpf as cpfcliente, cl.nome AS nomecliente," +
    "    (" +
    "        SELECT COALESCE(SUM(cp.quantidade * p.preco), 0) " +
    "        FROM comandaProduto cp " +
    "        JOIN produto p ON cp.produto = p.id " +
    "        WHERE cp.comanda = co.id" +
    "    ) AS total " +
    "FROM comanda co " +
    "    JOIN cliente cl ON (cl.cpf = co.cliente) " +
    "    JOIN clt ON (clt.cpf = co.emissao) " +
    "    JOIN funcionario f ON (f.cpf = clt.cpf) " +
    "ORDER BY co.fechada ASC, co.data DESC, co.id DESC";
        
    const {rows} =  await db.query(linhaQuery);
    
    res.status(200).send({
        success: true,
        message: "Comandas selecionados com sucesso",
        data: rows
    });
}

// RF09 – Consultar comandas consolidadas
// – filtro por cliente (CPF/nome) ou por id da comanda
// – opcionalmente restringe para comandas do dia (hoje)
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

    // RF09 – Filtro adicional “somente comandas de hoje”
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

// RF08 – Abrir comanda para registrar consumo durante a sessão
// – garante que o cliente tenha no máximo uma comanda em aberto (fechada=false)
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

    // RF08 – Verifica se já existe comanda aberta para o cliente
    // se já existir, reutiliza a mesma (não cria uma nova)
    let result = await db.query("SELECT id FROM comanda WHERE cliente=$1 AND fechada=false", [cliente]);

    if(result.rowCount > 0){
        res.status(200).send({
            success: true,
            message: "Comanda já estava aberta",
            data: result.rows 
        });
        return;
    }

    // RF08 – Cria nova comanda aberta (estado inicial de consumo)
    result = await db.query("INSERT INTO comanda (data, emissao, cliente, fechada) VALUES ($1, $2, $3, false) RETURNING id", [dataHoje, funcionario, cliente]);

    res.status(200).send({
        success: true,
        message: "Comanda aberta com sucesso",
        data: result.rows 
    });
}

// RF08 – Registrar/atualizar consumo de produtos na comanda
// – soma quantidade se o produto já existe na comanda, senão insere
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
    
    // RF08 – Verifica se já há linha de comandaProduto para esse produto
    const result = await db.query("SELECT quantidade FROM comandaProduto WHERE comanda=$1 AND produto=$2", [comanda, produto]);
    if(result.rowCount){
        const novaQtd = parseFloat(result.rows[0].quantidade) + parseFloat(quantidade);

        // RF08 – Atualiza quantidade total consumida do produto na comanda
        await db.query("UPDATE comandaProduto SET quantidade=$1 WHERE comanda=$2 AND produto=$3", [novaQtd, comanda, produto]);
            res.status(200).send({
            success: true,
            message: "Produto somado a comanda"
        });
        return;
    }

    // RF08 – Insere novo produto na comanda
    await db.query("INSERT INTO comandaProduto VALUES ($1, $2, $3)", [comanda, produto, quantidade]);

    res.status(200).send({
        success: true,
        message: "Produto adicionado a comanda",
    });
}

// RF09 – Finalizar comanda consolidada ao final da sessão
// – muda status da comanda para fechada=true
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

// Buscar produtos de uma comanda específica
exports.getProdutosDaComanda = async(req, res) => {
    const comandaId = req.query.comandaId;
    
    if(!comandaId){
        res.status(400).send({
            success: false,
            message: "ID da comanda não fornecido",
        });
        return;
    }

    const linhaQuery = 
        "SELECT p.id, p.nome, p.preco, cp.quantidade, " +
        "(cp.quantidade * p.preco) AS subtotal " +
        "FROM comandaProduto cp " +
        "JOIN produto p ON cp.produto = p.id " +
        "WHERE cp.comanda = $1 " +
        "ORDER BY p.nome";

    const {rows} = await db.query(linhaQuery, [comandaId]);

    res.status(200).send({
        success: true,
        message: "Produtos da comanda carregados com sucesso",
        data: rows
    });
}
