import axios, { type AxiosInstance } from 'axios'

export interface UserData {
    nome: string;
    cpf: string;
    vip: boolean;
    data_hora_fim_vip: Date | null;
    role: 'clt' | 'cliente';
    minutos_plataformas?: PlataformasMinutos[];
}

export interface PlataformasMinutos {
    nome: string;
    tipo: 0 | 1 | 2; // 0: PC, 1: Console, 2: Simulador
    minutos: number;
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
    idade_recomendada: number;
    multiplayer: boolean;
    url_capa: string;
}

export default class APIClient {
    client: AxiosInstance;
    userData: UserData | null = null;

    async getUserData(): Promise<UserData | null> {
        if (this.userData) {
            return this.userData;
        }
        return new Promise((resolve) => {
            setTimeout(() => {
                this.userData = {
                    nome: "João Silva",
                    cpf: "123.456.789-00",
                    vip: true,
                    data_hora_fim_vip: new Date("2024-12-31T23:59:59"),
                    role: "cliente",
                    minutos_plataformas: [
                        { nome: "Computador", tipo: 0, minutos: 150 },
                        { nome: "PlayStation", tipo: 1, minutos: 200 },
                        { nome: "Simulador X", tipo: 2, minutos: 75 },
                    ],
                };
                resolve(this.userData);
            }, 1000);
        });
    }

    constructor() {
        this.client = axios.create({
            baseURL: 'http://localhost:8080/api',
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    get(resource: string, params: Record<string, any> = {}) {
        return new Promise<ApiResponse>((resolve: Function, reject: Function) => {
            this.client.get(resource, { params })
                .then(response => this.handleResponse(response, resolve))
                .catch(error => this.handleError(error, reject));
        });
    }

    handleResponse(response: any, resolve: Function): void {
        const apiResponse: ApiResponse = response.data;
        resolve(apiResponse);
    }

    handleError(error: any, reject: Function): void {
        console.error('API Error:', error);
        const apiResponse: ApiResponse = error.response ? error.response.data : {
            success: false,
            data: null,
            message: 'Unknown error occurred',
        };
        reject(apiResponse);
    }

    post(resource: string, data: Record<string, any>) {
        return new Promise<ApiResponse>((resolve, reject) => {
            this.client.post(resource, data)
                .then(response => this.handleResponse(response, resolve))
                .catch(error => this.handleError(error, reject));
        });
    }

    login(username: string, password: string) {
        return this.post('/login', { username, password });
    }
}
