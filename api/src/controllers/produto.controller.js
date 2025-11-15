exports.getProdutos = async (req, res) => {
    const { nome, preco, baixaQntd } = req.query;
    const params = [];
    let paramCount = 0;

    let query = `
        SELECT 
            id AS produtoId,
            nome AS produtoNome,
            preco AS precoProduto,
            estoque AS precoEstoque
        FROM produto WHERE 1=1
    `;

    if (nome) {
        paramCount++;
        query += ` AND nome LIKE $${paramCount}`;
        params.push(nome);
    }

    if (preco) {
        paramCount++;
        query += ` AND preco = $${paramCount}`;
        params.push(preco);
    }

    if (baixaQntd) {
        query += ` AND estoque < 10`;
    }

    query += " ORDER BY nome";

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
        return res.status(404).send({
            success: false,
            errors: ["Nenhum produto encontrado!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Produtos consultados com sucesso!",
        data: rows.map((row) => {
            return {
                produtoId: row.produtoId,
                produtoNome: row.produtoNome,
                precoProduto: row.precoProduto,
                precoEstoque: row.precoEstoque
            }
        })

    });
};

exports.getProduto = async (req, res) => {
    const { id } = req.query;
    const { rows } = await db.query(`
        SELECT 
            id AS produtoId,
            nome AS produtoNome,
            preco AS precoProduto,
            estoque AS precoEstoque
        FROM produto 
        WHERE m.id = $1`,
        [id]
    );

    const produto = rows[0];

    if (!produto) {
        return res.status(404).send({
            success: false,
            errors: ["Produto não encontrada!"],
        });
    }

    res.status(200).send({
        success: true,
        message: "Produto consultado com sucesso!",
        data: {
            produto: {
            produtoId: produto.produtoId,
            produtoNome: produto.produtoNome,
            precoProduto: produto.precoProduto,
            precoEstoque: produto.precoEstoque
        }
        }

    });
};