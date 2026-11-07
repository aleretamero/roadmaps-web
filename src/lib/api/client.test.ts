import { ApiError } from './errors'
import { unwrap } from './client'

const res = (status: number) => new Response(null, { status })

describe('unwrap', () => {
  it('devolve os dados quando a resposta é 2xx', async () => {
    await expect(
      unwrap(Promise.resolve({ data: { id: 1 }, response: res(200) })),
    ).resolves.toEqual({ id: 1 })
  })

  it('lança ApiError com o Problem Details', async () => {
    const problem = {
      type: 'about:blank',
      title: 'Não encontrado',
      status: 404,
      code: 'not_found' as const,
    }
    const p = unwrap(Promise.resolve({ error: problem, response: res(404) }))
    await expect(p).rejects.toBeInstanceOf(ApiError)
    await expect(p).rejects.toMatchObject({ status: 404, code: 'not_found' })
  })

  it('transforma falha de rede em network_error', async () => {
    await expect(
      unwrap(Promise.reject(new TypeError('fetch failed'))),
    ).rejects.toMatchObject({ code: 'network_error' })
  })
})
