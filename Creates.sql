-- TABELA plataforma
CREATE TABLE IF NOT EXISTS plataforma (
    nome VARCHAR(100) NOT NULL,
    tipo SMALLINT NOT NULL,
    CONSTRAINT pk_plataforma PRIMARY KEY (nome),
    CONSTRAINT ck_plataforma_tipo CHECK (tipo = ANY (ARRAY[0,1,2]))
);

-- TABELA especificacoes
CREATE TABLE IF NOT EXISTS especificacoes (
    id INTEGER NOT NULL,
    placamae VARCHAR(255) NOT NULL,
    processador VARCHAR(255) NOT NULL,
    placavideo VARCHAR(255) NOT NULL,
    ram VARCHAR(100) NOT NULL,
    fonte VARCHAR(100) NOT NULL,
    gabinete VARCHAR(100) NOT NULL,
    monitor VARCHAR(100) NOT NULL,
    teclado VARCHAR(100) NOT NULL,
    mouse VARCHAR(100) NOT NULL,
    CONSTRAINT pk_especificacoes PRIMARY KEY (id)
);

-- TABELA pacote
CREATE TABLE IF NOT EXISTS pacote (
    id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    CONSTRAINT pk_pacote PRIMARY KEY (id),
    CONSTRAINT uq_pacote_nome UNIQUE (nome),
    CONSTRAINT ck_pacote_preco CHECK (preco >= 0)
);

-- TABELA jogo
CREATE TABLE IF NOT EXISTS jogo (
    id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    urlimagem VARCHAR(500),
    idaderecomendada SMALLINT NOT NULL DEFAULT 0,
    multiplayer BOOLEAN NOT NULL DEFAULT false,
    inicializacao VARCHAR(256),
    CONSTRAINT pk_jogo PRIMARY KEY (id),
    CONSTRAINT uq_jogo_nome UNIQUE (nome),
    CONSTRAINT ck_jogo_idade CHECK (idaderecomendada >= 0)
);

-- TABELA produto
CREATE TABLE IF NOT EXISTS produto (
    id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT pk_produto PRIMARY KEY (id),
    CONSTRAINT uq_produto_nome UNIQUE (nome),
    CONSTRAINT ck_produto_preco CHECK (preco >= 0),
    CONSTRAINT ck_produto_estoque CHECK (estoque >= 0)
);

-- TABELA funcionario
CREATE TABLE IF NOT EXISTS funcionario (
    cpf VARCHAR(14) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    CONSTRAINT pk_funcionario PRIMARY KEY (cpf),
    CONSTRAINT ck_funcionario_tipo CHECK (tipo = ANY (ARRAY['clt','terceirizado']))
);

-- TABELA clt
CREATE TABLE IF NOT EXISTS clt (
    cpf VARCHAR(14) NOT NULL,
    senhaacesso VARCHAR(255) NOT NULL,
    numerocarteira VARCHAR(100) NOT NULL,
    dataadmissao DATE NOT NULL,
    telefone VARCHAR(20),
    endereco VARCHAR(255),
    salario NUMERIC(10,2) NOT NULL,
    CONSTRAINT pk_clt PRIMARY KEY (cpf),
    CONSTRAINT uq_clt_numerocarteira UNIQUE (numerocarteira),
    CONSTRAINT fk_clt_funcionario FOREIGN KEY (cpf)
        REFERENCES funcionario (cpf) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_clt_salario CHECK (salario >= 0)
);

-- TABELA contrato
CREATE TABLE IF NOT EXISTS contrato (
    num INTEGER NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    CONSTRAINT pk_contrato PRIMARY KEY (num),
    CONSTRAINT fk_contrato_funcionario FOREIGN KEY (cpf)
        REFERENCES funcionario (cpf),
    CONSTRAINT ck_contrato_valor CHECK (valor >= 0)
);

-- TABELA cliente
CREATE TABLE IF NOT EXISTS cliente (
    cpf VARCHAR(14) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    loginacesso VARCHAR(100) NOT NULL,
    senhaacesso VARCHAR(255) NOT NULL,
    genero CHAR(1) NOT NULL,
    datanasc DATE NOT NULL,
    endereco VARCHAR(255),
    vip BOOLEAN NOT NULL DEFAULT false,
    datafimvip DATE,
    tempocomputador INTEGER NOT NULL DEFAULT 0,
    tempoconsole INTEGER NOT NULL DEFAULT 0,
    temposimulador INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT pk_cliente PRIMARY KEY (cpf),
    CONSTRAINT uq_cliente_login UNIQUE (loginacesso),
    CONSTRAINT ck_cliente_genero CHECK (genero IN ('M','F','O'))
);

-- TABELA telcliente
CREATE TABLE IF NOT EXISTS telcliente (
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    CONSTRAINT pk_telcliente PRIMARY KEY (cpf, telefone),
    CONSTRAINT fk_telcliente_cliente FOREIGN KEY (cpf)
        REFERENCES cliente (cpf) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABELA agendamento
CREATE TABLE IF NOT EXISTS agendamento (
    id INTEGER NOT NULL,
    datatempoinicio TIMESTAMPTZ NOT NULL,
    datatempofim TIMESTAMPTZ,
    agendadopor VARCHAR(14) NOT NULL,
    CONSTRAINT pk_agendamento PRIMARY KEY (id),
    CONSTRAINT fk_agendamento_funcionario FOREIGN KEY (agendadopor)
        REFERENCES funcionario (cpf) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_agendamento_datas CHECK (datatempofim > datatempoinicio)
);

-- TABELA evento
CREATE TABLE IF NOT EXISTS evento (
    id INTEGER NOT NULL,
    cliente VARCHAR(14) NOT NULL,
    nome VARCHAR(100),
    status VARCHAR(30),
    CONSTRAINT ck_evento_status CHECK (status IN ('agendado','em andamento','concluido','cancelado')),
    CONSTRAINT pk_evento PRIMARY KEY (id),
    CONSTRAINT fk_evento_agendamento FOREIGN KEY (id)
        REFERENCES agendamento (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_evento_cliente FOREIGN KEY (cliente)
        REFERENCES cliente (cpf) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABELA maquina
CREATE TABLE IF NOT EXISTS maquina (
    id INTEGER NOT NULL,
    lastseen TIMESTAMPTZ,
    nomeplat VARCHAR(100) NOT NULL,
    CONSTRAINT pk_maquina PRIMARY KEY (id),
    CONSTRAINT fk_maquina_plataforma FOREIGN KEY (nomeplat)
        REFERENCES plataforma (nome)
);

-- TABELA hardware
CREATE TABLE IF NOT EXISTS hardware (
    id INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    idmaquina INTEGER,
    CONSTRAINT pk_hardware PRIMARY KEY (id),
    CONSTRAINT fk_hardware_maquina FOREIGN KEY (idmaquina)
        REFERENCES maquina (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT ck_hardware_estado CHECK (estado = ANY(ARRAY['ativo','inativo','em manutencao']))
);

-- TABELA eventomaquina
CREATE TABLE IF NOT EXISTS eventomaquina (
    evento INTEGER NOT NULL,
    maquina INTEGER NOT NULL,
    CONSTRAINT pk_eventomaquina PRIMARY KEY (evento, maquina),
    CONSTRAINT fk_eventomaquina_evento FOREIGN KEY (evento)
        REFERENCES evento (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_eventomaquina_maquina FOREIGN KEY (maquina)
        REFERENCES maquina (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABELA manutencao
CREATE TABLE IF NOT EXISTS manutencao (
    id INTEGER NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    prioridade VARCHAR(50) NOT NULL,
    CONSTRAINT pk_manutencao PRIMARY KEY (id),
    CONSTRAINT fk_manutencao_agendamento FOREIGN KEY (id)
        REFERENCES agendamento (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_manutencao_tipo CHECK (tipo = ANY(ARRAY['preventiva','corretiva','atualizacao'])),
    CONSTRAINT ck_manutencao_prioridade CHECK (prioridade = ANY(ARRAY['baixa','media','alta','urgente']))
);

-- TABELA manutencaomaquina
CREATE TABLE IF NOT EXISTS manutencaomaquina (
    idmanutencao INTEGER NOT NULL,
    idmaquina INTEGER NOT NULL,
    idhardware INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    CONSTRAINT pk_manutencaomaquina PRIMARY KEY (idmanutencao, idhardware),
    CONSTRAINT fk_manutencaomaquina_hardware FOREIGN KEY (idhardware)
        REFERENCES hardware (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_manutencaomaquina_manutencao FOREIGN KEY (idmanutencao)
        REFERENCES manutencao (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_manutencaomaquina_maquina FOREIGN KEY (idmaquina)
        REFERENCES maquina (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABELA manutencaorealiza
CREATE TABLE IF NOT EXISTS manutencaorealiza (
    idmanutencao INTEGER NOT NULL,
    funcionario VARCHAR(14) NOT NULL,
    CONSTRAINT pk_manutencaorealiza PRIMARY KEY (idmanutencao, funcionario),
    CONSTRAINT fk_manutencaorealiza_funcionario FOREIGN KEY (funcionario)
        REFERENCES funcionario (cpf) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_manutencaorealiza_manutencao FOREIGN KEY (idmanutencao)
        REFERENCES manutencao (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABELA ordinario
CREATE TABLE IF NOT EXISTS ordinario (
    id INTEGER NOT NULL,
    tempocomputador NUMERIC(10,2) NOT NULL,
    tempoconsole NUMERIC(10,2) NOT NULL,
    temposimulador NUMERIC(10,2) NOT NULL,
    CONSTRAINT pk_ordinario PRIMARY KEY (id),
    CONSTRAINT fk_ordinario_pacote FOREIGN KEY (id)
        REFERENCES pacote (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_ordinario_preco_pc CHECK (tempocomputador >= 0),
    CONSTRAINT ck_ordinario_preco_console CHECK (tempoconsole >= 0),
    CONSTRAINT ck_ordinario_preco_simulador CHECK (temposimulador >= 0)
);

-- TABELA pacotevip
CREATE TABLE IF NOT EXISTS pacotevip (
    id INTEGER NOT NULL,
    tempoadicionar INTEGER NOT NULL,
    CONSTRAINT pk_pacotevip PRIMARY KEY (id),
    CONSTRAINT fk_pacotevip_pacote FOREIGN KEY (id)
        REFERENCES pacote (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_pacotevip_tempo CHECK (tempoadicionar > 0)
);

-- TABELA jogoplataforma
CREATE TABLE IF NOT EXISTS jogoplataforma (
    idjogo INTEGER NOT NULL,
    nomeplataforma VARCHAR(100) NOT NULL,
    CONSTRAINT pk_jogo_plataforma PRIMARY KEY (idjogo, nomeplataforma),
    CONSTRAINT fk_idjogo FOREIGN KEY (idjogo)
        REFERENCES jogo (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_nomeplataforma FOREIGN KEY (nomeplataforma)
        REFERENCES plataforma (nome) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABELA computador
CREATE TABLE IF NOT EXISTS computador (
    nome VARCHAR(100) NOT NULL,
    especificacoes INTEGER NOT NULL,
    CONSTRAINT pk_computador PRIMARY KEY (nome),
    CONSTRAINT fk_computador_especificacoes FOREIGN KEY (especificacoes)
        REFERENCES especificacoes (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABELA console
CREATE TABLE IF NOT EXISTS console (
    nome VARCHAR(100) NOT NULL,
    nserie VARCHAR(50) NOT NULL,
    CONSTRAINT pk_console PRIMARY KEY (nome)
);

-- TABELA simulador
CREATE TABLE IF NOT EXISTS simulador (
    nome VARCHAR(100) NOT NULL,
    nserie VARCHAR(50) NOT NULL,
    CONSTRAINT pk_simulador PRIMARY KEY (nome)
);

-- TABELA sessao
CREATE TABLE IF NOT EXISTS sessao (
    cliente VARCHAR(14) NOT NULL,
    datatempoinicio TIMESTAMPTZ NOT NULL,
    datatempofim TIMESTAMPTZ,
    motivotermino VARCHAR(255),
    maquina INTEGER NOT NULL,
    CONSTRAINT pk_sessao PRIMARY KEY (cliente, datatempoinicio),
    CONSTRAINT fk_sessao_cliente FOREIGN KEY (cliente)
        REFERENCES cliente (cpf) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_sessao_maquina FOREIGN KEY (maquina)
        REFERENCES maquina (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_sessao_motivo 
        CHECK (motivotermino = ANY (ARRAY['tempo_esgotado','deslogou','erro','removido_admin']))
);

-- TABELA sessaojogo
CREATE TABLE IF NOT EXISTS sessaojogo (
    cliente VARCHAR(14) NOT NULL,
    datatempoinicio TIMESTAMPTZ NOT NULL,
    jogo INTEGER NOT NULL,
    datatempofim TIMESTAMPTZ,
    CONSTRAINT pk_sessaojogo PRIMARY KEY (cliente, datatempoinicio, jogo),
    CONSTRAINT fk_sessaojogo_jogo FOREIGN KEY (jogo)
        REFERENCES jogo (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_sessaojogo_sessao FOREIGN KEY (cliente, datatempoinicio)
        REFERENCES sessao (cliente, datatempoinicio) ON UPDATE CASCADE ON DELETE CASCADE
);

-- TABELA alerta
CREATE TABLE IF NOT EXISTS alerta (
    id INTEGER NOT NULL,
    mensagem TEXT NOT NULL,
    datahora TIMESTAMPTZ NOT NULL DEFAULT now(),
    clt VARCHAR(14),
    CONSTRAINT pk_alerta PRIMARY KEY (id),
    CONSTRAINT fk_alerta_clt FOREIGN KEY (clt)
        REFERENCES clt (cpf) ON UPDATE CASCADE ON DELETE SET NULL
);

-- TABELA comanda
CREATE TABLE comanda (
    id INTEGER NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    emissao VARCHAR(14),
    cliente VARCHAR(14) NOT NULL,
    fechada BOOLEAN DEFAULT false,
    CONSTRAINT pk_comanda PRIMARY KEY (id),
    CONSTRAINT fk_comanda_cliente FOREIGN KEY (cliente)
        REFERENCES cliente (cpf) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_comanda_funcionario FOREIGN KEY (emissao)
        REFERENCES funcionario (cpf) ON UPDATE CASCADE ON DELETE SET NULL
);

-- TABELA comandaproduto
CREATE TABLE IF NOT EXISTS comandaproduto (
    comanda INTEGER NOT NULL,
    produto INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT pk_comandaproduto PRIMARY KEY (comanda, produto),
    CONSTRAINT fk_comandaproduto_comanda FOREIGN KEY (comanda)
        REFERENCES comanda (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_comandaproduto_produto FOREIGN KEY (produto)
        REFERENCES produto (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_comandaproduto_quantidade CHECK (quantidade > 0)
);

-- TABELA clientepacote
CREATE TABLE IF NOT EXISTS clientepacote (
    cliente VARCHAR(14) NOT NULL,
    pacote INTEGER NOT NULL,
    datatempo TIMESTAMPTZ NOT NULL DEFAULT CURRENT_DATE,
    descontoaplicado BOOLEAN,
    CONSTRAINT pk_clientepacote PRIMARY KEY (cliente, pacote, datatempo),
    CONSTRAINT fk_clientepacote_cliente FOREIGN KEY (cliente)
        REFERENCES cliente (cpf) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_clientepacote_pacote FOREIGN KEY (pacote)
        REFERENCES pacote (id) ON UPDATE CASCADE ON DELETE CASCADE
);
