export const INSTRUCOES_TIPO_LAUDO: Record<string, string> = {
    "Perícia Judicial": `FOCO PERICIAL (NBR 13752): Estabeleça OBRIGATORIAMENTE o NEXO CAUSAL para cada anomalia. Identifique tecnicamente a causa raiz (ex: recalque, infiltração, vibração) e documente a relação com eventuais obras vizinhas.`,

    "Cautelar de Vizinhança": `FOCO CAUTELAR DE VIZINHANÇA (NBR 13752): Documente o estado ATUAL antes de eventuais alterações. Para cada anomalia, estabeleça nexo causal com possível responsabilidade de obra vizinha. Priorize evidências fotográficas.`,

    "Vistoria Técnica": `FOCO VISTORIA TÉCNICA (IBAPE): Constate o estado de conservação atual. Descreva condições gerais, materiais e sistemas observados. Registre patologias APENAS quando existentes — não force identificação de problemas inexistentes.`,

    "Inspeção Predial": `FOCO INSPEÇÃO PREDIAL (NBR 16747): Classifique o estado de conservação e categorize falhas como: manutenção, uso ou causas endógenas. Avalie a perda de desempenho funcional sem superdimensionar achados.`,

    "Laudo de Reforma": `FOCO REFORMA (NBR 16280): Avalie as condições estruturais e de segurança antes, durante ou após a reforma. Verifique conformidade com o projeto aprovado, impactos em áreas comuns e vizinhas, e o atendimento às normas de acessibilidade e prevenção de incêndio.`,

    "Laudo de Avaliação": `FOCO AVALIAÇÃO (NBR 14653): Determine o valor de mercado do imóvel com base em metodologia comparativa, evolutiva ou de renda. Descreva características construtivas, estado de conservação, padrão de acabamento e fatores de valorização ou depreciação.`,

    "Laudo Cautelar": `FOCO CAUTELAR (NBR 13752): Documente o estado ATUAL do imóvel antes de eventuais intervenções vizinhas. Para cada anomalia pré-existente, registre localização, extensão e classificação. Priorize evidências fotográficas para resguardo jurídico.`,
};

export const getInstrucaoExtra = (tipoLaudo: string): string => {
    return INSTRUCOES_TIPO_LAUDO[tipoLaudo as keyof typeof INSTRUCOES_TIPO_LAUDO] || "";
};