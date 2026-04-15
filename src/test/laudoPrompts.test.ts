import { describe, it, expect } from 'vitest'
import {
  INSTRUCOES_TIPO_LAUDO,
  getInstrucaoExtra,
} from '@/lib/laudoPrompts'

// ─── INSTRUCOES_TIPO_LAUDO ───────────────────────────────────────────────────

describe('INSTRUCOES_TIPO_LAUDO', () => {
  it('contém os 7 tipos de laudo esperados', () => {
    const tiposEsperados = [
      'Perícia Judicial',
      'Cautelar de Vizinhança',
      'Vistoria Técnica',
      'Inspeção Predial',
      'Laudo de Reforma',
      'Laudo de Avaliação',
      'Laudo Cautelar',
    ]
    tiposEsperados.forEach((tipo) => {
      expect(INSTRUCOES_TIPO_LAUDO).toHaveProperty(tipo)
    })
  })

  it('cada instrução é uma string não vazia', () => {
    Object.values(INSTRUCOES_TIPO_LAUDO).forEach((instrucao) => {
      expect(typeof instrucao).toBe('string')
      expect(instrucao.length).toBeGreaterThan(0)
    })
  })

  it('Perícia Judicial menciona NBR 13752', () => {
    expect(INSTRUCOES_TIPO_LAUDO['Perícia Judicial']).toContain('NBR 13752')
  })

  it('Inspeção Predial menciona NBR 16747', () => {
    expect(INSTRUCOES_TIPO_LAUDO['Inspeção Predial']).toContain('NBR 16747')
  })

  it('Laudo de Reforma menciona NBR 16280', () => {
    expect(INSTRUCOES_TIPO_LAUDO['Laudo de Reforma']).toContain('NBR 16280')
  })

  it('Laudo de Avaliação menciona NBR 14653', () => {
    expect(INSTRUCOES_TIPO_LAUDO['Laudo de Avaliação']).toContain('NBR 14653')
  })
})

// ─── getInstrucaoExtra ────────────────────────────────────────────────────────

describe('getInstrucaoExtra', () => {
  it('retorna instrução correta para tipo de laudo existente', () => {
    const resultado = getInstrucaoExtra('Vistoria Técnica')
    expect(resultado).toContain('IBAPE')
    expect(resultado.length).toBeGreaterThan(0)
  })

  it('retorna string vazia para tipo desconhecido', () => {
    expect(getInstrucaoExtra('Tipo Inexistente')).toBe('')
    expect(getInstrucaoExtra('')).toBe('')
  })

  it('retorna a mesma instrução que INSTRUCOES_TIPO_LAUDO para cada tipo', () => {
    Object.keys(INSTRUCOES_TIPO_LAUDO).forEach((tipo) => {
      expect(getInstrucaoExtra(tipo)).toBe(INSTRUCOES_TIPO_LAUDO[tipo])
    })
  })

  it('é case-sensitive (tipo com case errado retorna vazio)', () => {
    expect(getInstrucaoExtra('perícia judicial')).toBe('')
    expect(getInstrucaoExtra('VISTORIA TÉCNICA')).toBe('')
  })

  it('Cautelar de Vizinhança menciona nexo causal', () => {
    expect(getInstrucaoExtra('Cautelar de Vizinhança')).toContain('nexo causal')
  })

  it('Laudo Cautelar menciona resguardo jurídico', () => {
    expect(getInstrucaoExtra('Laudo Cautelar')).toContain('resguardo jur')
  })
})
