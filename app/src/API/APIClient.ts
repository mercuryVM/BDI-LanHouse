import axios, { type AxiosInstance } from 'axios'

export interface UserData {
    nome: string;
    cpf: string;
    vip: boolean;
    data_hora_fim_vip: Date | null;
    role: 'clt' | 'cliente';
    tempoSimulador?: number;
    tempoConsole?: number;
    tempoComputador?: number;
    maquina: Maquina
}

export interface Maquina {
    id: number;
    nomeplat: string;
    tipo: 0 | 1 | 2; // 0: PC, 1: Console, 2: Simulador
    lastseen: string;
}

export interface PlataformasMinutos {
    nome: string;
    tipo: 0 | 1 | 2; // 0: PC, 1: Console, 2: Simulador
    minutos: number;
}

export interface Pacote {
    pacid: number;
    pacId: number;
    preco: number;
    datatempo: string;
    cpf: string;
    clinome: string;
    pacnome: string;
    tempoadicionar?: number;
    tempocomputador?: number;
    tempoconsole?: number;
    temposimulador?: number;
    descontoaplicado?: boolean;
}

export interface PacoteInfo {
    id: number;
    nome: string;
    preco: number;
    tempoadicionar?: number;
    tempocomputador?: number;
    tempoconsole?: number;
    temposimulador?: number;
}

// Types para respostas da API
export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    errors?: string[];
}

export interface Game {
    id: string;
    nome: string;
    descricao: string;
    idadeRecomendada: number;
    multiplayer: boolean;
    urlImagem: string;
    inicializacao: string;
    plataformas: string[];
    numeroSessoes?: number;
    picoHora?: number;
}

export interface Cliente {
    cpf: string;
    nome: string;
    loginacesso: string;
    genero: string;
    datanasc: Date;
    endereco: string;
    vip: boolean;
    datafimvip: Date | null;
    tempocomputador: number;
    tempoconsole: number;
    temposimulador: number;
}

export interface Sessao {
    id: number;
    cliente: Partial<Cliente>;
    datatempoinicio: Date;
    datatempofim: Date | null;
    motivotermino: string | null;
    maquina: Partial<Maquina>;
}

export interface Manutencao {
    manutencaoid: number;
    manutencaotipo: string;
    manutencaoprioridade: string;
    manutencaodatatempoinicio: Date;
    manutencaodatatempofim?: Date | null;
    nomefuncionario: string;
    cpffuncionario: string;
    maquinas: {
        maquinaid: number;
        nomeplat: string;
        tipoplat: number;
    }[];
    hardwares: {
        hardwareid: number;
        hardwarenome: string;
        hardwareestado: string;
        hardwaretipo: string;
        motivo?: string | null;
    }[];
}

export interface Hardware {
    hardwareid: number;
    hardwarenome: string;
    hardwareestado: string;
    hardwaretipo: string;
    maquinaid?: number;
    nomeplat?: string;
    tipoPlat?: number;
    motivo?: string | null;
}

export interface Evento {
    eventoid: number;
    eventonome: string;
    eventodescricao?: string | null;
    eventodatatempoinicio: Date;
    eventodatatempofim?: Date | null;
    eventostatus: string;
    nomefuncionario: string;
    cpffuncionario: string;
    maquinas: {
        maquinaid: number;
        nomeplat: string;
        tipoplat: number;
    }[];
    cliente: {
        cpf: string;
        nome: string;
    } | null;
}

export default class APIClient {
    client: AxiosInstance;
    userData: UserData | null = null;
    _token: string | null = null;

    set token(token: string) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        this._token = token;
        localStorage.setItem('api_token', token);
    }

    get token(): string | null {
        return this._token;
    }

    async getUserData(): Promise<UserData | null> {
        try {
            const userData = await this.get<UserData>('/user');
            this.userData = userData;
            return userData;
        } catch (error) {
            throw error;
        }
    }

    constructor() {
        this.client = axios.create({
            baseURL: 'http://localhost:8080/api',
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
        })

        const storedToken = localStorage.getItem('api_token');
        if (storedToken) {
            this.token = storedToken;
        }
    }

    async get<T = any>(resource: string, params: Record<string, any> = {}): Promise<T> {
        try {
            const response = await this.client.get(resource, { params });
            const apiResponse = this.handleResponse<T>(response);
            if (apiResponse.success) {
                return apiResponse.data;
            } else {
                throw new Error(apiResponse.message || 'Request failed');
            }
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async post<T = any>(resource: string, data: Record<string, any> = {}): Promise<T> {
        try {
            const response = await this.client.post(resource, data);
            const apiResponse = this.handleResponse<T>(response);
            if (apiResponse.success) {
                return apiResponse.data;
            } else {
                throw new Error(apiResponse.message || 'Request failed');
            }
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleResponse<T>(response: any): ApiResponse<T> {
        return response.data as ApiResponse<T>;
    }

    private handleError(error: any): Error {
        console.error('API Error:', error);
        if (error.response?.data) {
            const apiResponse: ApiResponse = error.response.data;
            return new Error(apiResponse.message || 'API request failed');
        }
        return new Error(error.message || 'Unknown error occurred');
    }

    async logout(): Promise<void> {
        try {
            await this.post('/logout');
            this.token = null as any;
            this.userData = null;
            localStorage.removeItem('api_token');
        } catch (e) {
            console.error('Logoff failed:', e);
        }
    }

    async login(username: string, password: string, maquina: number): Promise<string> {
        try {
            const token = await this.post<string>('/login', { username, password, maquina });
            console.log('Login successful, received token:', token);    
            this.token = token;

            return token;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async getAllJogos(): Promise<Game[]> {
        try {
            const jogos = await this.get<Game[]>('/getAllJogos');
            return jogos;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getRecentJogos(): Promise<Game[]> {
        try {
            const jogos = await this.get<Game[]>('/getRecentJogos');
            return jogos;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getAllClientes(): Promise<Cliente[]> {
        try {
            const clientes = await this.get<Cliente[]>('/getAllClientes');
            return clientes;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async verificarClienteNovo(cpf: string): Promise<{ novo: boolean }> {
        try {
            const result = await this.get<{ novo: boolean }>('/verificarClienteNovo', { cpf });
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateCliente(cpf: string, updates: Partial<Cliente>): Promise<Cliente> {
        try {
            const updatedCliente = await this.put<Cliente>(`/updateCliente?search=${cpf}`, updates);
            return updatedCliente;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createCliente(novoCliente: Omit<Cliente, 'tempocomputador' | 'tempoconsole' | 'temposimulador'>): Promise<Cliente> {
        try {
            const createdCliente = await this.post<Cliente>('/createCliente', novoCliente);
            return createdCliente;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deleteCliente(cpf: string): Promise<void> {
        try {
            await this.post<void>('/deleteCliente', { cpf });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getSessoes(query: Record<string, any>): Promise<Sessao[]> {
        console.log(query)
        try {
            const sessoes = await this.get<Sessao[]>('/getSessoes', query);
            return sessoes;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getMostPlayedJogos(): Promise<Game[]> {
        try {
            const jogos = await this.get<Game[]>('/getMostPlayedJogos');
            return jogos;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getAllMaquinas(): Promise<Maquina[]> {
        try {
            const maquinas = await this.get<Maquina[]>('/getAllMaquinas');
            return maquinas;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getMostFixedMaquinas(): Promise<{
        vezesConsertada: number;
        id: number;
        nomePlataforma: string;
        tipoPlataforma: number;
        diasMenorIntervalo?: number;
    }[]> {
        try {
            const result = await this.get<{
                vezesConsertada: number;
                id: number;
                nomePlataforma: string;
                tipoPlataforma: number;
                diasMenorIntervalo?: number;
            }[]>('/getMostFixedMaquinas');
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async listarMaquinasDisponiveis(): Promise<{
        id: number;
        nome: string;
        tipo: number;
    }[]> {
        try {
            const result = await this.get<{
                id: number;
                nome: string;
                tipo: number;
            }[]>('/listarMaquinasDisponiveis');
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async contarMaquinasDisponiveisPorTipo(): Promise<{
        tipo: number;
        disponiveis: string;
    }[]> {
        try {
            const result = await this.get<{
                tipo: number;
                disponiveis: string;
            }[]>('/contarMaquinasDisponiveisPorTipo');
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async contarMaquinasDisponiveisPorPlataforma(): Promise<{
        nome: string;
        tipo: number;
        disponiveis: string;
    }[]> {
        try {
            const result = await this.get<{
                nome: string;
                tipo: number;
                disponiveis: string;
            }[]>('/contarMaquinasDisponiveisPorPlataforma');
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getAllComandas(): Promise<{
        id: number;
        data: string;
        cpffuncionario: string;
        nomefuncionario: string;
        cpfcliente: string;
        nomecliente: string;
        total: string;
        fechada?: boolean;
    }[]> {
        try {
            const result = await this.get<{
                id: number;
                data: string;
                cpffuncionario: string;
                nomefuncionario: string;
                cpfcliente: string;
                nomecliente: string;
                total: string;
                fechada?: boolean;
            }[]>('/getAllComandas');
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getProdutosDaComanda(comandaId: number): Promise<{
        id: number;
        nome: string;
        preco: string;
        quantidade: string;
        subtotal: string;
    }[]> {
        try {
            const result = await this.get<{
                id: number;
                nome: string;
                preco: string;
                quantidade: string;
                subtotal: string;
            }[]>(`/getProdutosDaComanda?comandaId=${comandaId}`);
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async abrirComandaDoCliente(cliente: string, funcionario: string): Promise<{ id: number }[]> {
        try {
            const result = await this.post<{ id: number }[]>('/abrirComandaDoCliente', {
                cliente,
                funcionario
            });
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async adicionarProdutoNaComanda(comanda: number, produto: number, quantidade: number): Promise<void> {
        try {
            await this.post('/adicionarProdutoNaComanda', {
                comanda,
                produto,
                quantidade
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async fecharComandaDoCliente(comanda: number): Promise<void> {
        try {
            await this.put('/fecharComandaDoCliente', {
                comanda
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getProdutos(): Promise<{
        produtoid: number;
        produtonome: string;
        precoproduto: string;
        precoestoque: number;
    }[]> {
        try {
            const result = await this.get<{
                produtoid: number;
                produtonome: string;
                precoproduto: string;
                precoestoque: number;
            }[]>('/getProdutos');
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getHardwaresDisponiveis(): Promise<Hardware[]> {
        try {
            const hardwares = await this.get<Hardware[]>('/getHardwaresDisponiveis');
            return hardwares;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async addHardwareToMaquina(data: {
        maquinaId: number;
        hardwareId: number;
    }): Promise<ApiResponse<Hardware>> {
        try {
            const response = await this.postRaw('/addHardwareToMaquina', data);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async removeHardwareFromMaquina(hardwareId: number): Promise<ApiResponse> {
        try {
            const response = await this.postRaw('/removeHardwareFromMaquina', { hardwareId });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Hardware / Estoque
    async getAllHardwares(query?: { tipo?: string; estado?: string; disponivel?: string }): Promise<Hardware[]> {
        try {
            const hardwares = await this.get<Hardware[]>('/getAllHardwares', query || {});
            return hardwares;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getEstoqueStats(): Promise<{
        total: number;
        disponiveis: number;
        em_uso: number;
        porEstado: Array<{ estado: string; quantidade: number }>;
        porTipo: Array<{ tipo: string; quantidade: number }>;
    }> {
        try {
            const stats = await this.get('/getEstoqueStats');
            return stats;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getTiposHardware(): Promise<string[]> {
        try {
            const tipos = await this.get<string[]>('/getTiposHardware');
            return tipos;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getEstadosHardware(): Promise<string[]> {
        try {
            const estados = await this.get<string[]>('/getEstadosHardware');
            return estados;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createHardware(data: { nome: string; tipo: string; estado?: string }): Promise<ApiResponse<Hardware>> {
        try {
            const response = await this.postRaw('/createHardware', data);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateHardware(id: number, data: { nome?: string; tipo?: string; estado?: string }): Promise<ApiResponse<Hardware>> {
        try {
            const response = await this.client.put(`/updateHardware?id=${id}`, data);
            return this.handleResponse<Hardware>(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deleteHardware(id: number): Promise<ApiResponse> {
        try {
            const response = await this.client.delete(`/deleteHardware?id=${id}`);
            return this.handleResponse(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getAllClientePacotes(): Promise<Pacote[]> {
        try {
            const pacotes = await this.get<Pacote[]>('/getAllClientePacotes');
            return pacotes;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getAllPacotes(): Promise<Pacote[]> {
        try {
            const pacotes = await this.get<Pacote[]>('/getAllPacotes');
            return pacotes;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createClientePacote(cpf: string, pacote: number, data?: string, descontoaplicado?: boolean): Promise<ApiResponse> {
        try {
            const response = await this.postRaw('/createClientePacote', { cpf, pacote, data, descontoaplicado });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getManutencoes(query?: { prioridade?: string; tipo?: string; periodo?: string }): Promise<Manutencao[]> {
        try {
            const manutencoes = await this.get<Manutencao[]>('/getManutencoes', query || {});
            return manutencoes;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createManutencao(data: {
        tipo: string;
        prioridade: string;
        datatempoinicio: string;
        datatempofim?: string;
        maquinaId: number;
        agendadoPor: string;
        hardwareIds?: number[];
        hardwares?: { hardwareId: number; motivo: string }[];
    }): Promise<{ id: number }> {
        try {
            const result = await this.post<{ id: number }>('/manutencao', data);
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateManutencao(id: number, data: {
        tipo?: string;
        prioridade?: string;
        datatempoinicio?: string;
        datatempofim?: string;
    }): Promise<void> {
        try {
            await this.put<void>(`/manutencao?id=${id}`, data);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deleteManutencao(id: number): Promise<void> {
        try {
            await this.delete<void>(`/manutencao?id=${id}`);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getEventos(): Promise<Evento[]> {
        try {
            const eventos = await this.get<Evento[]>('/getEventos');
            return eventos;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createEvento(data: {
        nome: string;
        descricao?: string;
        datatempoinicio: string;
        datatempofim?: string;
        status?: string;
        clienteCpf: string;
        maquinaIds: number[];
        agendadoPor: string;
    }): Promise<ApiResponse<{ id: number }>> {
        try {
            const response = await this.postRaw('/createEvento', data);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateEvento(id: number, data: {
        nome?: string;
        descricao?: string;
        datatempoinicio?: string;
        datatempofim?: string;
        status?: string;
        clienteCpf?: string;
        maquinaIds?: number[];
    }): Promise<void> {
        try {
            await this.put<void>(`/updateEvento?id=${id}`, data);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deleteEvento(id: number): Promise<void> {
        try {
            await this.delete<void>(`/deleteEvento?id=${id}`);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getHardwaresByMaquina(maquinaId: number): Promise<Hardware[]> {
        try {
            const hardwares = await this.get<Hardware[]>('/getHardwaresByMaquina', { maquinaId });
            return hardwares;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async listarClientesFiltro(filtro: {
        totalHoras?: boolean;
        numSessoes?: boolean;
        frequenciaVisitas?: boolean;
        ultimaVisita?: boolean;
        clientesInativos?: boolean;
        deltaMeses?: number;
    }): Promise<any[]> {
        try {
            const result = await this.post<any[]>('/listarClientesFiltro', filtro);
            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Métodos utilitários para diferentes tipos de requisições
    async put<T = any>(resource: string, data: Record<string, any> = {}): Promise<T> {
        try {
            const response = await this.client.put(resource, data);
            const apiResponse = this.handleResponse<T>(response);
            if (apiResponse.success) {
                return apiResponse.data;
            } else {
                throw new Error(apiResponse.message || 'Request failed');
            }
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async delete<T = any>(resource: string): Promise<T> {
        try {
            const response = await this.client.delete(resource);
            const apiResponse = this.handleResponse<T>(response);
            if (apiResponse.success) {
                return apiResponse.data;
            } else {
                throw new Error(apiResponse.message || 'Request failed');
            }
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Método para fazer requisições que retornam o ApiResponse completo
    async getRaw<T = any>(resource: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.get(resource, { params });
            return this.handleResponse<T>(response);
        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data as ApiResponse<T>;
            }
            return {
                success: false,
                data: null as any,
                message: error.message || 'Unknown error occurred'
            };
        }
    }

    async postRaw<T = any>(resource: string, data: Record<string, any> = {}): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.post(resource, data);
            return this.handleResponse<T>(response);
        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data as ApiResponse<T>;
            }
            return {
                success: false,
                data: null as any,
                message: error.message || 'Unknown error occurred'
            };
        }
    }
}
