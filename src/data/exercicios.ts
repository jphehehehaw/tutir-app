export type NivelDificuldade = 'Fácil' | 'Médio' | 'Difícil';

export interface Exercicio {
  id: string;
  disciplina: 'Matemática A' | 'Português' | 'Prog I' | 'Álgebra Linear' | 'Cálculo I' | 'ITI';
  materia: string;
  nivel: NivelDificuldade;
  xpRecompensa: number;
  enunciado: string;
}

export const MAPA_MATERIAS: Record<string, string[]> = {
  'Matemática A': [
    'Todas as Matérias',
    'Complexos',
    'Geometria no Espaço',
    'Funções e Derivadas',
    'Probabilidades e Estatística',
    'Sequências e Sucessões',
  ],
  'Português': [
    'Todas as Matérias',
    'Gramática',
    'Sermão de Santo António',
    'Os Lusíadas',
    'Mensagem',
    'Frei Luís de Sousa',
    'O Ano da Morte de Ricardo Reis',
  ],
  'Prog I': [
    'Todas as Matérias',
    'Estruturas de Controlo',
    'Funções e Escopo',
    'Arrays e Matrizes',
    'Algoritmos de Ordenação',
    'Orientação a Objetos',
  ],
  'Álgebra Linear': [
    'Todas as Matérias',
    'Sistemas de Equações Lineares',
    'Matrizes e Determinantes',
    'Espaços Vetoriais',
    'Valores e Vetores Próprios',
  ],
  'Cálculo I': [
    'Todas as Matérias',
    'Limites e Continuidade',
    'Derivadas e Regra da Cadeia',
    'Estudo Completo de Funções',
    'Integrais e Métodos de Integração',
    'Séries Numéricas',
  ],
  'ITI': [
    'Todas as Matérias',
    'Sistemas de Numeração',
    'Álgebra de Boole',
    'Arquitetura de Computadores',
    'Redes e Protocolos',
  ],
};

export const BANCO_EXERCIOS: Exercicio[] = [
  // --- MATEMÁTICA A: COMPLEXOS ---
  {
    id: 'mat_c1',
    disciplina: 'Matemática A',
    materia: 'Complexos',
    nivel: 'Fácil',
    xpRecompensa: 30,
    enunciado: 'Sendo z1 = 2 + 3i e z2 = 1 - 2i, calcula z1 + z2 e z1 * z2 na forma algébrica.',
  },
  {
    id: 'mat_c2',
    disciplina: 'Matemática A',
    materia: 'Complexos',
    nivel: 'Médio',
    xpRecompensa: 50,
    enunciado: 'Escreve o número complexo z = 1 + i√3 na forma trigonométrica r(cos θ + i sin θ).',
  },
  {
    id: 'mat_c3',
    disciplina: 'Matemática A',
    materia: 'Complexos',
    nivel: 'Difícil',
    xpRecompensa: 100,
    enunciado: 'Determina todas as raízes cúbicas do número complexo z = -8i e representa-as no plano de Argand.',
  },

  // --- MATEMÁTICA A: GEOMETRIA ---
  {
    id: 'mat_g1',
    disciplina: 'Matemática A',
    materia: 'Geometria no Espaço',
    nivel: 'Médio',
    xpRecompensa: 50,
    enunciado: 'Determina a equação cartesiana do plano α que passa por A(1,0,-2) e é perpendicular ao vetor v=(2,-1,3).',
  },

  // --- PORTUGUÊS: GRAMÁTICA ---
  {
    id: 'port_g1',
    disciplina: 'Português',
    materia: 'Gramática',
    nivel: 'Fácil',
    xpRecompensa: 30,
    enunciado: 'Classifica a oração sublinhada: "Embora estudasse muito, ficou ansioso antes do exame."',
  },

  // --- CÁLCULO I: LIMITES ---
  {
    id: 'calc_l1',
    disciplina: 'Cálculo I',
    materia: 'Limites e Continuidade',
    nivel: 'Médio',
    xpRecompensa: 50,
    enunciado: 'Calcula lim(x->0) de (sin(5x) / x) utilizando limites notáveis ou Regra de L\'Hôpital.',
  },

  // --- PROG I: ARRAYS ---
  {
    id: 'prog_a1',
    disciplina: 'Prog I',
    materia: 'Arrays e Matrizes',
    nivel: 'Difícil',
    xpRecompensa: 100,
    enunciado: 'Escreve uma função em Java que receba uma matriz quadrada N x N e retorne a soma da diagonal principal.',
  },
];