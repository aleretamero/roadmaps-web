import { Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/lib/api/errors'

/** Carregando uma página: o esqueleto de título + cards que toda tela tem. */
export function PagePending() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="mx-auto w-full max-w-[1264px] px-4 py-8 sm:px-8"
    >
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="mt-5 h-64 rounded-xl" />
    </div>
  )
}

/** Erro ao carregar uma rota: mensagem amigável e "Tentar de novo". */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryReset = useQueryErrorResetBoundary()
  useEffect(() => queryReset.reset(), [queryReset])
  return (
    <div className="mx-auto w-full max-w-[1264px] px-4 py-16 sm:px-8">
      <div
        role="alert"
        className="mx-auto max-w-md rounded-xl border border-line bg-surface p-8 text-center"
      >
        <h1 className="text-xl font-semibold text-ink-strong">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-ink-muted">{errorMessage(error)}</p>
        <Button
          className="mt-6"
          onClick={() => {
            reset()
            void router.invalidate()
          }}
        >
          Tentar de novo
        </Button>
      </div>
    </div>
  )
}

/** 404 de qualquer rota. */
export function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[1264px] flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
      <p className="text-sm font-medium text-ink-muted">Erro 404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink-strong">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-ink-muted">
        O endereço pode estar errado ou o conteúdo foi removido.
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Ir para o painel</Link>
      </Button>
    </main>
  )
}
