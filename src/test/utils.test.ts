import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (className merger)', () => {
  it('retorna string vazia sem argumentos', () => {
    expect(cn()).toBe('')
  })

  it('retorna classe única sem alteração', () => {
    expect(cn('flex')).toBe('flex')
  })

  it('combina múltiplas classes', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2')
  })

  it('ignora valores falsy (undefined, null, false)', () => {
    expect(cn('flex', undefined, null, false, 'items-center')).toBe(
      'flex items-center'
    )
  })

  it('resolve conflitos do Tailwind (último vence)', () => {
    // twMerge resolve: p-4 sobrescreve p-2
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('resolve conflito de text-color', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('aceita objetos condicionais (clsx behavior)', () => {
    expect(cn({ flex: true, hidden: false })).toBe('flex')
    expect(cn({ flex: true, 'items-center': true })).toBe('flex items-center')
  })

  it('aceita arrays (clsx behavior)', () => {
    expect(cn(['flex', 'items-center'])).toBe('flex items-center')
  })

  it('combina objeto + string + condicional', () => {
    const isActive = true
    expect(cn('base-class', { 'active-class': isActive }, 'extra')).toBe(
      'base-class active-class extra'
    )
  })

  it('resolve conflito de margin', () => {
    expect(cn('m-4', 'mx-2')).toBe('m-4 mx-2')
    // mx-2 não é redundante com m-4 — ambos coexistem (twMerge comportamento esperado)
  })
})
