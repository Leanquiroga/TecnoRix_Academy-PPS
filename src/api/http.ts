import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios'
import { TOKEN_KEY } from '../configs/constants'

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
  // Adjuntar token si está disponible. Si aún no se llamó a setAuthToken (ej. antes de rehidratar Zustand),
  // intentar leer el token desde localStorage (persist de Zustand) de forma perezosa.
  let token = authToken
  if (!token && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(TOKEN_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // Soportar formato de persist { state: {...}, version: n } y, por compatibilidad, objeto plano
        token = parsed?.state?.token ?? parsed?.token ?? null
        if (token && !authToken) {
          // Cachear en memoria para siguientes requests
          authToken = token
          http.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
      }
    } catch {
      // ignorar parse errors
    }
  }

  if (token) {
    const headers: AxiosRequestHeaders = (config.headers || {}) as AxiosRequestHeaders
    headers.Authorization = `Bearer ${token}`
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
