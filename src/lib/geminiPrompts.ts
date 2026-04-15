import { getInstrucaoExtra } from './laudoPrompts';

interface AnaliseLaudoParams {
    tipoLaudo: string;
    totalFotos: number;
    fotoIndex: number;
}

export const gerarPromptAnaliseIA = ({
    tipoLaudo,
    totalFotos,
    fotoIndex,
}: AnaliseLaudoParams): string => {
    const instrucaoExtra = getInstrucaoExtra(tipoLaudo);

    return `
Aja como Engenheiro Sênior de Inspeções Prediais. Contexto: ${tipoLaudo}.

${instrucaoExtra}

---

REGRA DE CONSISTÊNCIA: As tarefas 1 e 2 DEVEM ser consistentes. Se uma foto é marcada como 'Sistema OK' na TAREFA 2, NÃO gere achado com patologia na TAREFA 1 para o mesmo elemento.

---

TAREFA 1 (Análise Técnica + Matriz GUT):

Analise a imagem e identifique achados relevantes (anomalias ou constatações positivas).

- Se PATOLOGIA existe: avalie Matriz GUT (Gravidade, Urgência, Tendência — notas 1 a 5 cada) e estime custo ("Baixo" < R$ 5.000 | "Médio" R$ 5.000-20.000 | "Alto" > R$ 20.000)

- Se estado BOM/NORMAL: registre como constatação positiva com GUT = 1,1,1 e custo = "N/A"

---

TAREFA 2 (Legenda Individual — Foto ${fotoIndex} de ${totalFotos}):

Para esta foto, crie um item com:

- 'numero_foto': ${fotoIndex}

- 'status': "Patologia Identificada" | "Estado de Conservação" | "Sistema OK"

- 'descricao': Estruture em 3 partes:

  1. AMBIENTE/SETOR: ex: "Sala de estar", "Cobertura", "Fachada norte"

  2. ELEMENTO(S): ex: "alvenaria de vedação", "estrutura de concreto", "esquadria"

  3. CONSTATAÇÃO: descreva objetivamente com termos técnicos (fissuração, eflorescência, desplacamento, oxidação, infiltração, recalque, etc.)

---

RETORNE APENAS JSON VÁLIDO, sem markdown, sem explicações adicionais.

Formato esperado:
{
  "tarefa1": {
    "achados": [
      {
        "elemento": "string",
        "patologia": "string",
        "gut": { "gravidade": number, "urgencia": number, "tendencia": number },
        "custo_estimado": "Baixo" | "Médio" | "Alto" | "N/A"
      }
    ]
  },
  "tarefa2": {
    "numero_foto": ${fotoIndex},
    "status": "Patologia Identificada" | "Estado de Conservação" | "Sistema OK",
    "descricao": "string"
  }
}
`;
};