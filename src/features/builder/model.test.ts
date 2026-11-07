import { describe, expect, it } from 'vitest'
import {
  apiProblems,
  fieldErrors,
  fromImportModules,
  lineOfModule,
  parseImportJson,
  toImportModules,
} from './model'
import type { BuilderModule, BuilderValues } from './model'

const mod = (over: Partial<BuilderModule>): BuilderModule => ({
  key: 'a',
  title: 'C#',
  kind: 'required',
  after: null,
  alternativeTo: null,
  topics: [],
  ...over,
})

describe('validação do criador', () => {
  it('exige nome no roadmap novo e títulos únicos', () => {
    const v: BuilderValues = {
      name: ' ',
      goal: '',
      modules: [
        mod({
          key: 'a',
          topics: [
            { key: 't1', title: 'LINQ', isOptional: false, date: '' },
            { key: 't2', title: 'linq ', isOptional: false, date: '' },
            { key: 't3', title: '', isOptional: false, date: '' },
          ],
        }),
        mod({ key: 'b', title: 'c#' }),
        mod({ key: 'c', title: 'React', kind: 'optional' }),
      ],
    }
    expect(fieldErrors(v, true)).toEqual({
      name: 'Dê um nome ao roadmap',
      'modules[0].topics[1].title': 'Tópico repetido neste módulo',
      'modules[1].title': 'Já existe um módulo com esse nome',
    })
    expect(fieldErrors({ ...v, name: '' }, false).name).toBeUndefined()
    // o primeiro módulo de um roadmap novo não tem de quem ser alternativa
    expect(
      fieldErrors(
        { name: 'x', goal: '', modules: [mod({ kind: 'alternative' })] },
        true,
      ),
    ).toEqual({
      'modules[0].alternativeTo': 'Escolha de qual módulo este é alternativa',
    })
  })
})

describe('conversão', () => {
  it('editor → contrato, resolvendo âncoras por título', () => {
    const out = toImportModules([
      mod({
        key: 'a',
        title: 'React',
        topics: [
          { key: 't', title: ' Hooks ', isOptional: true, date: '2026-11-20' },
          { key: 'u', title: '', isOptional: false, date: '' },
        ],
      }),
      mod({ key: 'b', title: 'Angular', kind: 'alternative' }),
      mod({
        key: 'c',
        title: 'Testes',
        kind: 'optional',
        after: 'title:Fundamentos',
      }),
    ])
    expect(out).toEqual([
      {
        title: 'React',
        topics: [{ title: 'Hooks', isOptional: true, date: '2026-11-20' }],
      },
      { title: 'Angular', alternativeTo: 'React', topics: [] },
      { title: 'Testes', kind: 'optional', after: ['Fundamentos'], topics: [] },
    ])
  })

  it('contrato → editor', () => {
    const [a, b] = fromImportModules(
      [
        { title: 'React', topics: [{ title: 'Hooks' }] },
        { title: 'Vue', alternativeTo: 'React', after: ['Fundamentos'] },
      ],
      ['Fundamentos'],
    )
    expect(b!.kind).toBe('alternative')
    expect(b!.alternativeTo).toBe(`key:${a!.key}`)
    expect(b!.after).toBe('title:Fundamentos')
    expect(a!.topics[0]!.title).toBe('Hooks')
  })
})

describe('JSON importado', () => {
  const text = `{
  "nome": "AWS",
  "modulos": [
    { "titulo": "Fundamentos", "topicos": ["IAM"] },
    {
      "titulo": "Filas",
      "depoisDe": "Fundamentos",
      "topicos": [{ "titulo": "SQS", "opcional": true, "dataPrevista": "2026-11-20" }]
    }
  ]
}`
  it('aceita chaves em português e tópicos como texto', () => {
    const r = parseImportJson(text)
    expect(r.ok && r.value).toEqual({
      name: 'AWS',
      modules: [
        { title: 'Fundamentos', topics: [{ title: 'IAM' }] },
        {
          title: 'Filas',
          after: ['Fundamentos'],
          topics: [{ title: 'SQS', isOptional: true, date: '2026-11-20' }],
        },
      ],
    })
  })

  it('acha a linha de cada módulo', () => {
    expect(lineOfModule(text, 0)).toBe(4)
    expect(lineOfModule(text, 1)).toBe(5)
  })

  it('JSON quebrado e campos errados viram problemas', () => {
    const bad = parseImportJson('{ "modulos": [ { "titulo": 1 } ] }')
    expect(bad.ok).toBe(false)
    expect(parseImportJson('{ oi }')).toMatchObject({
      ok: false,
      problems: [{ text: 'O conteúdo não é um JSON válido.', line: 1 }],
    })
    expect(parseImportJson('')).toMatchObject({ ok: false })
  })

  it('erros da API apontam o módulo e a linha', () => {
    const r = parseImportJson(text)
    if (!r.ok) throw new Error()
    expect(
      apiProblems(
        { 'modules[1].after': ['Cria um ciclo: Filas → Fundamentos → Filas'] },
        text,
        r.value.modules,
      ),
    ).toEqual([
      { text: 'Filas: Cria um ciclo: Filas → Fundamentos → Filas', line: 5 },
    ])
  })
})
