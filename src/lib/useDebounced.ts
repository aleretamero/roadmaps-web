import { useEffect, useState } from 'react'

/** Valor que só muda depois de `ms` sem mudanças (para não chamar a API a cada tecla). */
export function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
