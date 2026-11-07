/** Ajuda da importação: o formato aceito e um exemplo para começar. */

export const FORMAT_JSON = `{
  "nome": "Frontend",
  "objetivo": "Publicar uma aplicação web",
  "modulos": [
    {
      "titulo": "Vue",
      "alternativaA": "React",
      "topicos": [
        { "titulo": "Composition API", "dataPrevista": "2026-11-20" },
        { "titulo": "Pinia", "opcional": true }
      ]
    },
    {
      "titulo": "Acessibilidade",
      "depoisDe": "Framework",
      "topicos": [{ "titulo": "ARIA" }]
    }
  ]
}`

export const EXAMPLE_JSON = `{
  "nome": "AWS para backend",
  "modulos": [
    { "titulo": "Fundamentos", "topicos": ["IAM e permissões", "Regiões e zonas"] },
    {
      "titulo": "Armazenamento",
      "topicos": [{ "titulo": "S3" }, { "titulo": "Políticas de bucket", "opcional": true }]
    },
    {
      "titulo": "Mensageria",
      "topicos": ["SQS", "SNS", { "titulo": "Filas FIFO", "opcional": true }]
    },
    { "titulo": "Computação", "topicos": ["Lambda", "ECS com Fargate"] }
  ]
}`
