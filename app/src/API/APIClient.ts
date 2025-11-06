import axios, { type AxiosInstance } from 'axios'

export default class APIClient {
    client: AxiosInstance;

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