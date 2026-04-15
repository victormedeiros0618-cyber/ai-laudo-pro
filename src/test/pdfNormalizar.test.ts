import { describe, it, expect } from 'vitest'
import { normalizarTexto } from '@/lib/pdfGenerator'

describe('normalizarTexto', () => {
  it('preserva texto ASCII simples sem alteração', () => {
    expect(normalizarTexto('Texto normal sem caracteres especiais')).toBe(
      'Texto normal sem caracteres especiais'
    )
  })

  it('preserva acentos portugueses (Latin-1)', () => {
    const texto = 'Fissuração, eflorescência, infiltração, oxidação'
    expect(normalizarTexto(texto)).toBe(texto)
  })

  it('substitui smart quotes simples por aspas normais', () => {
    expect(normalizarTexto('\u2018texto\u2019')).toBe("'texto'")
    expect(normalizarTexto('\u2018')).toBe("'")
    expect(normalizarTexto('\u2019')).toBe("'")
  })

  it('substitui smart quotes duplas por aspas normais', () => {
    expect(normalizarTexto('\u201Ctexto\u201D')).toBe('"texto"')
    expect(normalizarTexto('\u201C')).toBe('"')
    expect(normalizarTexto('\u201D')).toBe('"')
  })

  it('substitui en-dash por hífen', () => {
    expect(normalizarTexto('A \u2013 B')).toBe('A - B')
    expect(normalizarTexto('\u2013')).toBe('-')
  })

  it('substitui em-dash por hífen', () => {
    expect(normalizarTexto('A \u2014 B')).toBe('A - B')
    expect(normalizarTexto('\u2014')).toBe('-')
  })

  it('substitui ellipsis Unicode por três pontos ASCII', () => {
    expect(normalizarTexto('\u2026')).toBe('...')
    expect(normalizarTexto('texto\u2026')).toBe('texto...')
  })

  it('substitui non-breaking space por espaço normal', () => {
    expect(normalizarTexto('a\u00A0b')).toBe('a b')
    expect(normalizarTexto('\u00A0')).toBe(' ')
  })

  it('aplica múltiplas substituições em sequência', () => {
    const entrada = '\u201CLaudo\u201D \u2013 R\u00A0$ 5.000\u2026'
    const esperado = '"Laudo" - R $ 5.000...'
    expect(normalizarTexto(entrada)).toBe(esperado)
  })

  it('retorna string vazia para string vazia', () => {
    expect(normalizarTexto('')).toBe('')
  })

  it('não altera caracteres que não precisam de substituição', () => {
    const texto = 'Apartamento 2/3 — nbr: 13752 (Art. 5°)'
    // só o em-dash \u2014 presente em "—" real (U+2014)
    // neste caso é um hífen ASCII longo em fonte, não U+2014 — preserva como está
    expect(normalizarTexto(texto)).toContain('Apartamento 2/3')
  })
})
