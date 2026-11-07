import { createQueryClient } from './query-client'
import { ApiError } from './errors'

describe('createQueryClient', () => {
  it('não repete consulta que falhou com 4xx', async () => {
    const qc = createQueryClient()
    let calls = 0
    await expect(
      qc.fetchQuery({
        queryKey: ['x'],
        queryFn: () => {
          calls += 1
          throw new ApiError(404)
        },
      }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(calls).toBe(1)
  })

  it('avisa quando a sessão expira (401)', async () => {
    const onUnauthorized = vi.fn()
    const qc = createQueryClient({ onUnauthorized })
    await qc
      .fetchQuery({
        queryKey: ['y'],
        queryFn: () => {
          throw new ApiError(401)
        },
      })
      .catch(() => {})
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
