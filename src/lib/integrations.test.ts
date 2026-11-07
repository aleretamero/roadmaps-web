import { describe, expect, it } from 'vitest'
import { driveConnectUrl, timeZoneLabel, timeZones } from './integrations'

describe('integrações e fuso', () => {
  it('URL de conexão com o Drive', () => {
    expect(driveConnectUrl('/topics/1?tab=files')).toBe(
      '/api/v1/integrations/google-drive/connect?returnTo=%2Ftopics%2F1%3Ftab%3Dfiles',
    )
  })
  it('rótulo do fuso', () => {
    expect(
      timeZoneLabel('America/Sao_Paulo', new Date('2026-11-07T12:00:00Z')),
    ).toBe('America/São Paulo (UTC−3)')
    expect(timeZones('Etc/Desconhecido')[0]).toBe('Etc/Desconhecido')
  })
})
