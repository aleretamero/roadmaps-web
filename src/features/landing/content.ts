/** Textos da landing. Ficam aqui para a página e os testes usarem a mesma fonte. */

export const SUBJECTS = [
  'Inglês',
  'Violão',
  'Vestibular',
  'Certificação',
  'Programação',
] as const

export const STEPS = [
  {
    title: 'Monte o roadmap',
    text: 'Divida o assunto em módulos e tópicos. Comece do zero ou traga um roadmap pronto.',
  },
  {
    title: 'Escolha seus dias',
    text: 'Diga em que dias da semana você estuda. O app coloca um tópico em cada dia.',
  },
  {
    title: 'Estude e registre',
    text: 'Depois de estudar, marque o que fez. A etapa do tópico avança sozinha.',
  },
  {
    title: 'Acompanhe',
    text: 'Veja o progresso de cada roadmap, a sequência de dias e o que ficou para trás.',
  },
] as const

export const FEATURES = [
  {
    eyebrow: 'Roadmap',
    title: 'Seu caminho num mapa, com escolhas',
    text: 'Divida o que quer aprender em módulos e tópicos. Serve para qualquer assunto: um idioma, um instrumento, uma prova. Quando houver mais de um caminho, escolha o seu e o resto sai da conta.',
    bullets: [
      'Módulos opcionais e caminhos alternativos',
      'Arraste para reordenar, encaixe módulos no meio',
      'Comece, pause e retome cada módulo',
    ],
  },
  {
    eyebrow: 'Sessões',
    title: 'Registre em dez segundos',
    text: 'Depois de estudar, diga o que fez: estudei, pratiquei ou concluí. A etapa do tópico avança sozinha e a nota vai para a linha do tempo.',
    bullets: [
      'Etapas que podem ser puladas quando faz sentido',
      'Reagende sem perder o histórico',
      'Linha do tempo separada das alterações',
    ],
  },
  {
    eyebrow: 'Painel e agenda',
    title: 'Constância que dá para ver',
    text: 'Um tópico por dia nos dias que você escolhe. O painel mostra sua semana, a sequência de dias e o que está parado há tempo demais.',
    bullets: [
      'Mapa de calor das últimas semanas',
      'Hoje e próximos 7 dias num só lugar',
      'Alertas para tópicos parados e datas perdidas',
    ],
  },
] as const

export const EXTRAS = [
  {
    icon: 'notes',
    title: 'Anotações ricas',
    text: 'Escreva com listas, links, imagens e blocos destacados, direto no tópico.',
  },
  {
    icon: 'folder',
    title: 'Arquivos no seu Drive',
    text: 'Uma pasta por tópico, com pré-visualização dos arquivos.',
  },
  {
    icon: 'search',
    title: 'Busca que entende você',
    text: 'Sem se preocupar com acentos ou plural. Ache em títulos, anotações e arquivos.',
  },
  {
    icon: 'import',
    title: 'Importação',
    text: 'Traga um roadmap pronto de um arquivo e encaixe módulos no meio do caminho.',
  },
] as const

export const FAQ = [
  {
    q: 'Serve para qualquer assunto?',
    a: 'Sim. Um idioma, um instrumento, a faculdade, um concurso ou uma certificação: você define os módulos e os tópicos do seu jeito.',
  },
  {
    q: 'Preciso seguir uma ordem?',
    a: 'Os módulos seguem a sequência do roadmap, com módulos opcionais e caminhos alternativos quando houver mais de uma opção. Dentro de um módulo, a ordem dos tópicos é livre: arraste para reorganizar quando quiser.',
  },
  {
    q: 'Como funciona o agendamento?',
    a: 'Você escolhe os dias da semana em que estuda e o app coloca um tópico por dia. Se atrasar, reagende com um clique; o histórico do que você já fez continua lá.',
  },
  {
    q: 'Onde ficam meus arquivos?',
    a: 'No seu Google Drive, numa pasta que você escolhe, organizada por roadmap, módulo e tópico. Sem o Drive conectado, o app guarda os roadmaps, as sessões e as anotações.',
  },
  {
    q: 'Dá para trazer um roadmap pronto?',
    a: 'Sim. Envie um arquivo JSON com os módulos e tópicos. Dá até para dizer em que ponto de um roadmap existente cada módulo novo entra.',
  },
  {
    q: 'Preciso criar uma conta?',
    a: 'Sim, mas é rápido: no primeiro acesso a conta é criada para você. Pedimos só nome e e-mail.',
  },
] as const

export const META = {
  title: 'Roadmaps · Transforme o que você quer aprender em um plano',
  description:
    'Divida o assunto em módulos e tópicos, deixe o app distribuir os tópicos nos seus dias de estudo e registre o que fez. Para quem estuda por conta própria.',
} as const
