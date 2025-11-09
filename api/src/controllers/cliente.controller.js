const db = require("../config/database");
const argon2 = require('argon2');

exports.getAllClientes = async (req, res) => {
    const {rows} =  await db.query("SELECT * FROM cliente");
    console.log(rows);

    res.status(200).send({
        success: true,
        message: "Clientes selecionados com sucesso",
        data: rows
    });
}

exports.getCliente = async(req, res) => {
    const searchParam = req.query.search;
    const { rows } = await db.query(
        "SELECT * FROM cliente WHERE nome ILIKE $1 OR cpf = $2",
        [`%${searchParam}%`, searchParam]
    );
    console.log(rows);
    
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

exports.createCliente = async(req, res) => {
    const novoCliente = {
        cpf: req.body.cpf,
        nome: req.body.nome,
        loginacesso: req.body.loginacesso,
        senhaacesso: await argon2.hash(req.body.senhaacesso),
        genero: req.body.genero,
        dataNasc: req.body.dataNasc,
        endereco: req.body.endereco,
        vip: req.body.vip,
        datafimvip: req.body.datafimvip
    }

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

    await db.query(
        "INSERT INTO cliente VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0)",
        [novoCliente.cpf, novoCliente.nome, novoCliente.loginacesso, novoCliente.senhaacesso, novoCliente.genero, novoCliente.dataNasc, novoCliente.endereco, novoCliente.vip, novoCliente.datahoravip]
    );

    res.status(200).send({
        success: true,
        message: "Cliente cadastrado com sucesso"
    });
    return;
}

exports.deleteCliente = async(req, res) => {
    const cpfExcluir = req.body.cpf;
    
    const {rows} = await db.query(
        "SELECT nome FROM cliente WHERE cpf = $1",
        [cpfExcluir]
    );

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

exports.updateCliente = async(req, res, next) => {
    const cpf = req.query.search;

    const campos = [];
    const camposPermitidos = ["nome", "loginacesso", "senhaacesso", "genero", "dataNasc", "endereco", "vip", "datafimvip", "tempocomputador", "tempoconsole", "temposimulador"];

    let flagCampos = false; // se nenhum campo for valido, nao tenta atualizar

    for(let mod in req.body){
        if(!camposPermitidos.includes(mod)){
            continue
        }
        else{
            let valor;

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