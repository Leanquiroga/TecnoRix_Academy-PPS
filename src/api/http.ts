import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptores básicos
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // TODO: inyectar token desde store si existe
  return config
})

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // TODO: manejar refresh token 401 en el futuro
    return Promise.reject(error)
  }
)

export default http
