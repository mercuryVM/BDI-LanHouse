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
            baseURL: 'https://api.example.com',
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    get(resource: string, params: Record<string, any> = {}) {
        return this.client.get(resource, { params })
    }

    post(resource: string, data: Record<string, any>) {
        return this.client.post(resource, data)
    }
}
