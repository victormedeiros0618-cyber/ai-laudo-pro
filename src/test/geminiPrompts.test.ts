import { describe, it, expect } from 'vitest'
import { gerarPromptAnaliseIA } from '@/lib/geminiPrompts'

describe('gerarPromptAnaliseIA', () => {
  it('retorna uma string', () => {
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Vistoria Técnica',
      totalFotos: 5,
      fotoIndex: 1,
    })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(100)
  })

  it('inclui o tipo de laudo no prompt', () => {
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Perícia Judicial',
      totalFotos: 3,
      fotoIndex: 2,
    })
    expect(result).toContain('Perícia Judicial')
  })

  it('inclui fotoIndex e totalFotos no prompt', () => {
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Inspeção Predial',
      totalFotos: 10,
      fotoIndex: 7,
    })
    expect(result).toContain('7')
    expect(result).toContain('10')
    expect(result).toContain('Foto 7 de 10')
  })

  it('inclui a instrução extra do tipo de laudo', () => {
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Laudo de Avaliação',
      totalFotos: 2,
      fotoIndex: 1,
    })
    // getInstrucaoExtra('Laudo de Avaliação') menciona NBR 14653
    expect(result).toContain('NBR 14653')
  })

  it('sem instrução extra para tipo desconhecido (não quebra)', () => {
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Tipo Desconhecido',
      totalFotos: 1,
      fotoIndex: 1,
    })
    expect(typeof result).toBe('string')
    expect(result).toContain('Tipo Desconhecido')
  })

  it('sempre inclui instrução de retornar JSON válido', () => {
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Laudo Cautelar',
      totalFotos: 4,
      fotoIndex: 3,
    })
    expect(result).toContain('RETORNE APENAS JSON VÁLIDO')
  })

  it('inclui a estrutura GUT no prompt', () => {
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Vistoria Técnica',
      totalFotos: 2,
      fotoIndex: 2,
    })
    expect(result).toContain('Gravidade')
    expect(result).toContain('Urgência')
    expect(result).toContain('Tendência')
  })

  it('fotoIndex: 1 de 1 para laudo com foto única', () => {
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Laudo de Reforma',
      totalFotos: 1,
      fotoIndex: 1,
    })
    expect(result).toContain('Foto 1 de 1')
    expect(result).toContain("'numero_foto': 1")
  })

  it('campos numero_foto no formato JSON batem com fotoIndex', () => {
    const fotoIndex = 4
    const result = gerarPromptAnaliseIA({
      tipoLaudo: 'Vistoria Técnica',
      totalFotos: 8,
      fotoIndex,
    })
    // O JSON de exemplo deve ter o valor correto
    expect(result).toContain(`'numero_foto': ${fotoIndex}`)
    expect(result).toContain(`"numero_foto": ${fotoIndex}`)
  })
})
