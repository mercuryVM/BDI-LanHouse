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