const db = require("../config/database");
const argon2 = require('argon2');

// RF07 – Consultar todos os clientes
// (O requisito prevê listar todos os clientes cadastrados no sistema)
exports.getAllClientes = async (req, res) => {
    const {rows} =  await db.query("SELECT * FROM cliente");
    res.status(200).send({
        success: true,
        message: "Clientes selecionados com sucesso",
        data: rows
    });
}


// RF08 – Consultar cliente por CPF ou nome
// (Busca por CPF ou por nome usando filtro parcial - "ILIKE")
exports.getCliente = async(req, res) => {
    const searchParam = req.query.search;
    const { rows } = await db.query(
        "SELECT * FROM cliente WHERE nome ILIKE $1 OR cpf = $2",
        [`%${searchParam}%`, searchParam]
    );
    if(!rows){
        res.status(404).send({
            success: false,
            message: "Nenhum cliente encontrado"
        });
        return;
    }

    res.status(200).send({
        success: true,
        message: "Cliente(s) encontrado(s)",
        data: rows
    });
}


// RF06 – Cadastrar cliente
// (Inclui regras: CPF único, login único, senha criptografada, VIP opcional)
exports.createCliente = async(req, res) => {
    // RF06 – Dados necessários para cadastro + criptografia da senha
    const novoCliente = {
        cpf: req.body.cpf,
        nome: req.body.nome,
        loginacesso: req.body.loginacesso,
        senhaacesso: await argon2.hash(req.body.senhaacesso),  // RF06 – Senha deve ser segura
        genero: req.body.genero,
        datanasc: req.body.datanasc,
        endereco: req.body.endereco,
        vip: req.body.vip,
        datafimvip: req.body.datafimvip
    }

    // RF06 – Regra de unicidade: CPF ou login já cadastrados
    const {rows} = await db.query(
        "SELECT nome FROM cliente WHERE cpf = $1 OR loginacesso = $2",
        [novoCliente.cpf, novoCliente.loginacesso]
    );
    
    if(rows.length > 0){
        res.status(400).send({
            success: false,
            message: "Erro ao cadastrar cliente. Um cliente já possui esses dados."
        });
        return;
    }

    // RF06 – Inserção completa na tabela cliente
    await db.query(
        "INSERT INTO cliente VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0)",
        [novoCliente.cpf, novoCliente.nome, novoCliente.loginacesso, novoCliente.senhaacesso, novoCliente.genero, novoCliente.datanasc, novoCliente.endereco, novoCliente.vip, novoCliente.datafimvip]
    );

    res.status(200).send({
        success: true,
        message: "Cliente cadastrado com sucesso"
    });
    return;
}


// RF09 – Excluir cliente por CPF
exports.deleteCliente = async(req, res) => {
    const cpfExcluir = req.query.search;
    
    const {rows} = await db.query(
        "SELECT nome FROM cliente WHERE cpf = $1",
        [cpfExcluir]
    );

    // RF09 – Confirma existência antes de excluir
    if(rows.length > 0){
        await db.query(
            "DELETE FROM cliente WHERE cpf = $1",
            [cpfExcluir]
        );

        res.status(200).send({
            success: true,
            message: "Cliente excluído com sucesso"
        });
    }
    else{
        res.status(404).send({
            success: false,
            message: "Não foi possível excluir cliente. O CPF " + cpfExcluir + " não existe"
        });
    }
}


// RF10 – Atualizar dados do cliente
// (Vários campos podem ser atualizados; senha deve ser recriptografada)
exports.updateCliente = async(req, res, next) => {
    const cpf = req.query.search;

    const campos = [];

    // RF10 – Lista de campos permitidos para atualização
    const camposPermitidos = ["nome", "loginacesso", "senhaacesso", "genero", "datanasc", "endereco", "vip", "datafimvip", "tempocomputador", "tempoconsole", "temposimulador"];

    let flagCampos = false; // RF10 – Evita update vazio

    for(let mod in req.body){
        if(!camposPermitidos.includes(mod)){
            // RF10 – Ignora campos não permitidos
            continue
        }
        else{
            let valor;

            // RF10 – Senha deve ser novamente criptografada
            if(mod == "senhaacesso"){
                valor = await argon2.hash(req.body[mod]);
            }
            else{
                valor = req.body[mod];
            }
            
            campos.push({
                name: mod,
                value: valor
            });
            flagCampos = true;
        }
    }

    // RF10 – Monta query dinâmica se houver campos válidos
    if(flagCampos){
        const camposUpdate = campos.map((campo, index) => {
            return `${campo.name} = $${index + 1}`
        });

        const linhaUpdate = `UPDATE cliente SET ${camposUpdate.join(", ")} WHERE cpf = $${campos.length + 1}`;

        const valores = campos.map(campo => {
            return campo.value;
        });
        valores.push(cpf);

        const update = await db.query(linhaUpdate, valores);
        
        // RF10 – Tratamento de CPF inexistente
        if (update.rowCount === 0) {
            res.status(404).send({
                success: false,
                message: 'Erro ao atualizar cliente. CPF ' + cpf + ' não existe.'
            });
            return;
        }
    }
    else{
        res.status(400).send({
            success: false,
            message: 'Erro ao atualizar cliente. Campos inválidos.'
        });
    }

    next();
}


// RF11 – Verificar se o cliente é “novo” (nunca usou máquinas)
// (Consulta sessões associadas ao cliente)
exports.verificarClienteNovo = async (req, res) => {
    const cpf = req.query.cpf;

    // RF11 – Verifica existência do cliente
    let {rows} = await db.query("SELECT nome FROM cliente WHERE cpf = $1", [cpf]);

    if(rows.length == 0){
        res.status(404).send({
            success: false,
            message: "Esse cliente não existe"
        });
        return;
    }

    // RF11 – Verifica se o cliente já possui sessões registradas
    ({rows} = await db.query("SELECT c.nome FROM sessao s JOIN cliente c ON (s.cliente = c.cpf) WHERE c.cpf = $1", [cpf]));

    // RF11 – Retorna se é cliente novo ou recorrente
    if(rows.length == 0){
        res.status(200).send({
            success: true,
            data: { novo: true }, // é cliente novo
            message: "CPF " + cpf + " ainda não possui sessões"
        });
        return;
    }
    else{
        res.status(200).send({
            success: true,
            data: { novo: false }, // não é cliente novo
            message: "CPF " + cpf + " já possui sessões"
        });
        return;
    }
}

// Consultas por: 
// total de horas, 
// número de sessões, 
// frequência de visitas, 
// última visita, 
// clientes que não aparecem há mais que X meses
exports.listarClientesFiltro = async (req, res) => {
    const totalHoras = req.body.totalHoras;
    const numSessoes = req.body.numSessoes;
    const frequenciaVisitas = req.body.frequenciaVisitas;
    const ultimaVisita = req.body.ultimaVisita;
    const clientesInativos = req.body.clientesInativos;
    const deltaMeses = req.body.deltaMeses;

    let flagParamValidos = false;
    let query = "";

    if(totalHoras){
        query = "SELECT c.cpf, c.nome, c.vip, " +
                "ROUND(SUM(EXTRACT(EPOCH FROM (s.datatempofim - s.datatempoinicio))) / 3600, 1) AS horasTotal " +
                "FROM cliente c " +
                "JOIN sessao s ON c.cpf = s.cliente " +
                "WHERE s.datatempofim IS NOT NULL " +
                "GROUP BY c.cpf, c.nome, c.vip " +
                "ORDER BY horasTotal DESC;";
        
        flagParamValidos = true;
    }
    if(numSessoes){
        query = "SELECT c.nome, c.cpf, c.vip, " +
                "COUNT(datatempoinicio) as quantidadeSessoes " +
                "FROM cliente c " +
                "JOIN sessao s ON (c.cpf = s.cliente) " +
                "GROUP BY c.nome, c.cpf, c.vip " +
                "ORDER BY quantidadeSessoes DESC;";
        
        flagParamValidos = true;
    }
    if(frequenciaVisitas){ // nao entra na divisão os meses em que o cliente não teve nenhuma sessão
        query = "SELECT c.cpf, c.nome, c.vip, ROUND(AVG(sessoes_no_mes), 1) AS media_sessoes_por_mes " +
                "FROM ( " +
                    "SELECT s.cliente, " +
                        "DATE_TRUNC('month', s.dataTempoInicio) AS mes, " +
                        "COUNT(*) AS sessoes_no_mes " +
                    "FROM sessao s " +
                    "GROUP BY s.cliente, mes " +
                ") as s JOIN cliente c ON c.cpf = s.cliente " +
                "GROUP BY c.cpf, c.nome, c.vip " +
                "ORDER BY media_sessoes_por_mes DESC; "; 
        
        flagParamValidos = true;
    }
    if(ultimaVisita){
        query = "SELECT DISTINCT ON (cliente) c.cpf, c.nome, c.vip, " +
                    "dataTempoInicio, " +
                    "ROUND(EXTRACT(EPOCH FROM (s.datatempofim - s.datatempoinicio)) / 3600, 1) as duracao " +
                "FROM sessao s JOIN cliente c ON (c.cpf = s.cliente) " +
                "WHERE datatempofim IS NOT NULL " +
                "ORDER BY cliente, dataTempoInicio DESC;";
        
        flagParamValidos = true;
    }
    if(clientesInativos && deltaMeses){
        query = "SELECT c.cpf, c.nome, c.vip, MAX(s.dataTempoInicio) AS ultima_sessao " +
                "FROM cliente c " +
                "LEFT JOIN sessao s ON s.cliente = c.cpf " +
                "GROUP BY c.cpf, c.nome, c.vip " +
                `HAVING MAX(s.dataTempoInicio) < NOW() - INTERVAL '${deltaMeses} months' ` +
                "OR MAX(s.dataTempoInicio) IS NULL;";
        // interval nao aceita parametro, entao fiz dessa forma => sujeito a sql injection

        flagParamValidos = true;
    }

    if(flagParamValidos){
        const {rows} = await db.query(query, []);

        if(rows.length){
            res.status(200).send({
                success: true,
                data: rows,
                message: "Clientes encontrados"
            });
            return;
        }
        else{
            res.status(404).send({
                success: false,
                message: "Nenhum cliente encontrado"
            });
            return;
        }
    }
    else{
        res.status(400).send({
            success: false,
            message: "Parâmetros de filtro inválidos"
        });
        return;
    }
}
