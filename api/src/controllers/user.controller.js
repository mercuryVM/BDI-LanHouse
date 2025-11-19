const db = require("../config/database");

// RF11 – Gerenciar clientes (visão consolidada do perfil)
// • Retorna dados do cliente logado: VIP, tempos por plataforma, etc.
// • Apoia análises de frequência, total de horas, perfil do cliente, etc.
// RF06 / RF08 – Apoio à consolidação das sessões e consumo de pacotes
// • Exposição dos saldos de tempo (tempocomputador, tempoconsole, temposimulador)
// Requisitos de Dados – cliente: CPF, nome, VIP, data de fim VIP, tempos por plataforma

exports.user = async (req, res) => {
    // Recupera sessão autenticada (SessionManager já alimentou req.session)
    //pegar token do cabeçalho
    const userId = req.session.id;
    const userType = req.session.type;

    //se userType for cliente, buscar na tabela cliente, se for funcionario, buscar na tabela funcionario mas considere retornar vip se for cliente
    const { rows } =  await db.query(
        userType === 'cliente' ?
        "SELECT cpf, nome, vip, datafimvip, tempocomputador, tempoconsole, temposimulador FROM cliente WHERE cpf = $1" :
        "SELECT cpf, nome FROM funcionario WHERE cpf = $1",
        [userId]
    );
    const user = rows[0];
    
    if (!user) {
        return res.status(404).send({
            errors: ["Usuário não encontrado!"],
            success: false,
            data: null
        });
    }

    
    // RF11 – Monta visão consolidada do usuário:
    // • cliente: status VIP + data fim + tempos por plataforma
    // • funcionário: só identificação básica
    // • role: distingue “cliente” de “clt”
    // • maquina: máquina atual da sessão (apoia RF01/RF04/RF05)
    const userData = {
        cpf: user.cpf,
        nome: user.nome,
        vip: user.vip || null,
        data_hora_fim_vip: user.datafimvip || null,
        role: userType === 'cliente' ? 'cliente' : 'clt',
        tempoComputador: user.tempocomputador || 0,
        tempoConsole: user.tempoconsole || 0,
        tempoSimulador: user.temposimulador || 0,
        maquina: req.session.maquina || null
    };

    res.status(200).send({
        success: true,
        data: userData,
    });
};