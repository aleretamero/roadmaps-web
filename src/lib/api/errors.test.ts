import { ApiError, errorMessage, isApiError } from './errors'

describe('ApiError', () => {
  it('usa o code do Problem Details quando vem', () => {
    const e = new ApiError(409, {
      type: 'about:blank',
      title: 'Conflito',
      status: 409,
      code: 'drive_not_connected',
    })
    expect(e.code).toBe('drive_not_connected')
    expect(isApiError(e, 'drive_not_connected')).toBe(true)
    expect(errorMessage(e)).toMatch(/Google Drive/)
  })

  it.each([
    [400, 'validation_error'],
    [401, 'unauthorized'],
    [404, 'not_found'],
    [412, 'edit_conflict'],
    [500, 'internal_error'],
    [0, 'network_error'],
  ] as const)('deduz o code pelo status %i', (status, code) => {
    expect(new ApiError(status).code).toBe(code)
  })

  it('expõe os erros por campo', () => {
    const e = new ApiError(400, {
      type: 'about:blank',
      title: 'Inválido',
      status: 400,
      code: 'validation_error',
      errors: { name: ['Obrigatório'] },
    })
    expect(e.fieldErrors.name).toEqual(['Obrigatório'])
  })

  it('tem mensagem genérica para erros desconhecidos', () => {
    expect(errorMessage(new Error('x'))).toMatch(/Algo deu errado/)
  })
})
