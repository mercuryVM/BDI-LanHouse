const db = require("../config/database");

exports.createAutor = async (req, res) => {
    const { rg, nome, endereco } = req.body;
    const { rows } = await db.query(
        "INSERT INTO autor (rg, nome, endereco) VALUES ($1, $2, $3)",
        [rg, nome, endereco]
    );
    res.status(201).send({
        message: "Autor adicionado com sucesso!",
        body: {
            autor: { rg, nome, endereco }
        },
    });
};

exports.getAutor = async (req, res) => {
    const { rg } = req.query; //?rg=
    const { rows } = await db.query(
        "SELECT rg, nome, endereco FROM autor WHERE RG = $1",
        [rg]
    );
    const autor = rows[0];

    if (!autor) {
        return res.status(404).send({
            message: "Autor não encontrado!",
        });
    }

    res.status(200).send({
        message: "Autor consultado com sucesso!",
        body: {
            autor: {
                rg: autor.rg,
                nome: autor.nome,
                endereco: autor.endereco
            }
        },
    });
};

exports.deleteAutor = async (req, res) => {
    const { rg } = req.query; //?rg=
    const { rows } = await db.query(
        "DELETE FROM autor WHERE RG = $1",
        [rg]
    );

    res.status(200).send({
        message: "Autor deletado com sucesso!",
    });
};

exports.updateAutor = async (req, res, next) => {
    const { rg } = req.query;

    const camposPermitidos = ['nome', 'endereco'];
    const campos = [];

    for (let campoName in req.body) {
        if (!camposPermitidos.includes(campoName)) {
            // só ignora o campo que n é permitido
            continue;
        } else {
            campos.push({
                name: campoName,
                value: req.body[campoName]
            })
        }
    }

    let camposString = campos.map((campo, index) => {
        return `${campo.name} = $${index + 1}`
    })

    const query = `UPDATE autor SET ${camposString.join(", ")} WHERE rg = $${campos.length + 1}`;

    const valores = campos.map(campo => campo.value);
    valores.push(rg);

    /*
    const { nome, endereco } = req.body;

    const campos = [];
    const valores = [];
    let index = 1;

    if(nome){
        campos.push(`nome = $${index}`);
        valores.push(nome);
        index++;
    }

    if(endereco){
        campos.push(`endereco = $${index}`);
        valores.push(endereco);
        index++;
    }

    const query = `UPDATE autor SET ${campos.join(', ')} WHERE rg = $${index}`;
    console.log(query, valores)
    */
    const update = await db.query(query, valores);

    if (update.rowCount === 0) {
        return res.status(404).send({
            message: "Autor não encontrado!",
        });
    }

    next();
}