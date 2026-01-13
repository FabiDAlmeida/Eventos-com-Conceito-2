
export const CREST_STYLES = [
  'Clássico',
  'Moderno',
  'Contemporâneo',
  'Minimalista',
  'Romântico',
  'Gótico'
];

export const PROJECT_TYPES = [
  'Casamento',
  'Aniversário',
  'Corporativo',
  'Lançamento de Produto',
  'Gala',
  'Bodas'
];

export const BUDGET_RANGES = [
  'Econômico (< R$ 50k)',
  'Médio (R$ 50k - R$ 200k)',
  'Premium (R$ 200k - R$ 1M)',
  'Luxo (> R$ 1M)'
];

export const MODELS = {
  TEXT: 'gemini-3-flash-preview',
  PRO: 'gemini-3-pro-preview',
  IMAGE_FLASH: 'gemini-2.5-flash-image',
  IMAGE_PRO: 'gemini-3-pro-image-preview',
  TTS: 'gemini-2.5-flash-preview-tts',
  AUDIO: 'gemini-3-flash-preview'
};

export const STANDARD_BRIEFING_QUESTIONS = [
  "Qual é o objetivo principal do evento (ex: celebração íntima, festa extravagante)?",
  "Quais são as cores preferidas e as que devemos evitar completamente?",
  "Existe algum tema ou estilo específico (ex: Boho Chic, Industrial, Clássico)?",
  "Quais elementos são indispensáveis na decoração (ex: flores específicas, iluminação cênica)?",
  "Como você descreveria a atmosfera desejada (ex: aconchegante, energética, sofisticada)?",
  "Há restrições de materiais ou objetos que o cliente não gosta?",
  "Qual é o perfil dos convidados e como isso deve influenciar o ambiente?"
];

export const CHECKLIST_TEMPLATE = [
  { label: 'Contrato Assinado', category: 'Pré-produção' },
  { label: 'Briefing Finalizado', category: 'Pré-produção' },
  { label: 'Visita Técnica Realizada', category: 'Pré-produção' },
  { label: 'Plantas e Medidas', category: 'Pré-produção' },
  { label: 'Aprovação Visual (Ceres/Boards)', category: 'Pré-produção' },
  { label: 'Lista de Compras de Insumos', category: 'Produção' },
  { label: 'Contratação Floricultura', category: 'Produção' },
  { label: 'Testes de Iluminação', category: 'Produção' },
  { label: 'Layout Final de Mesa', category: 'Produção' },
  { label: 'Marcação do Espaço', category: 'Montagem' },
  { label: 'Montagem de Mobiliário', category: 'Montagem' },
  { label: 'Cenografia e Estruturas', category: 'Montagem' },
  { label: 'Elétrica e Iluminação', category: 'Montagem' },
  { label: 'Arranjos Florais', category: 'Montagem' },
  { label: 'Styling Final e Objetos', category: 'Montagem' },
  { label: 'Limpeza Pós-Montagem', category: 'Montagem' },
  { label: 'Manutenção e Reposição', category: 'Evento' },
  { label: 'Retirada de Materiais', category: 'Desmontagem' },
  { label: 'Inventário de Quebras', category: 'Desmontagem' },
  { label: 'Devolução de Locação', category: 'Desmontagem' },
];
