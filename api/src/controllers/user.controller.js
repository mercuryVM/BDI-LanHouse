const db = require("../config/database");

exports.user = async (req, res) => {
    //pegar token do cabeçalho
    const userId = req.session.id;
    const userType = req.session.type;

    //se userType for cliente, buscar na tabela cliente, se for funcionario, buscar na tabela funcionario mas considere retornar vip se for cliente
    const { rows } =  await db.query(
        userType === 'cliente' ?
        "SELECT cpf, nome, vip, datahorafimvip FROM cliente WHERE cpf = $1" :
        "SELECT cpf, nome FROM funcionario WHERE cpf = $1",
        [userId]
    );
    const user = rows[0];

    //pegar minutos de plataformas se for cliente da tabela cliente_plataformas
    if (userType === 'cliente') {
        const { rows: plataformaRows } = await db.query(
            "SELECT tipo, cliente, plataforma, minutosdisponiveis FROM plataforma LEFT JOIN cliente_plataformas ON plataforma = nome WHERE cliente = $1", 
            [userId]
        );

        const minutosPlataformas = plataformaRows.map(row => ({
            nome: row.plataforma,
            tipo: row.tipo,
            minutos: row.minutosdisponiveis || 0
        }));

        user.minutos_plataformas = minutosPlataformas;
    } 
    
    if (!user) {
        return res.status(404).send({
            errors: ["Usuário não encontrado!"],
            success: false,
            data: null
        });
    }

    const userData = {
        cpf: user.cpf,
        nome: user.nome,
        vip: user.vip || null,
        data_hora_fim_vip: user.datahorafimvip || null,
        role: userType === 'cliente' ? 'cliente' : 'clt',
        minutos_plataformas: user.minutos_plataformas || []
    };

    res.status(200).send({
        success: true,
        data: userData,
    });
};