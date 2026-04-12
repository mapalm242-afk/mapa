import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados ficam "frescos" por 5 minutos — não refaz a query
      // se o usuário navegar pra outra página e voltar dentro desse tempo
      staleTime: 5 * 60 * 1000,
      // Cache fica na memória por 10 minutos mesmo sem componente montado
      gcTime: 10 * 60 * 1000,
      // Não refaz ao focar a janela (evita flash de loading desnecessário)
      refetchOnWindowFocus: false,
      // Tenta 1x se falhar (não fica tentando infinito)
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
