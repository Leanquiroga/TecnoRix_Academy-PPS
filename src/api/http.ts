import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios'

// Si VITE_API_URL está definida, úsala tal cual (sin agregar /api).
// Si no está definida, usa '/api' para aprovechar el proxy de Vite en dev.
const baseURL = import.meta.env.VITE_API_URL || '/api'

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let authToken: string | null = null
export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete http.defaults.headers.common['Authorization']
  }
}

// Interceptores básicos
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    const headers: AxiosRequestHeaders = (config.headers || {}) as AxiosRequestHeaders
    headers.Authorization = `Bearer ${authToken}`
    config.headers = headers
  }
  return config
})

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Opcional: manejar 401 y reintentar con refresh
    return Promise.reject(error)
  }
)

export default http
