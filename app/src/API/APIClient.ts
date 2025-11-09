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
        if (this.userData) {
            return this.userData;
        }
        try {
            const userData = await this.get<UserData>('/user');
            this.userData = userData;
            return userData;
        } catch (error) {
            console.error('Failed to get user data:', error);
            return null;
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

            this.token = token;

            return token;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
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
