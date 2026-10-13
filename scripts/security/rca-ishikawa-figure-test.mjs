import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildIshikawaFigure,
  ISHIKAWA_CARD_WIDTH,
  ISHIKAWA_FIGURE_WIDTH,
  ISHIKAWA_LABEL_CHARACTERS,
  ISHIKAWA_VISIBLE_CAUSES,
  shortenIshikawaLabel,
} from '../../src/lib/rcaIshikawaFigure.ts'

test('long descriptions are shortened only for the figure', () => {
  const description = 'Controllo finale non completamente differenziato durante la preparazione contemporanea di medicinali simili'
  const label = shortenIshikawaLabel(description)
  assert.ok(label.length <= ISHIKAWA_LABEL_CHARACTERS + 1)
  assert.ok(label.endsWith('…'))
  assert.equal(shortenIshikawaLabel('Causa breve'), 'Causa breve')
  assert.equal(description.length > label.length, true)
})

test('dense figure retains all totals and prioritizes root causes without changing input', () => {
  const branches = Array.from({ length: 8 }, (_, branchIndex) => ({
    causes: Array.from({ length: 12 }, (_, causeIndex) => ({
      description: `Categoria ${branchIndex + 1} causa ${causeIndex + 1} con descrizione molto lunga ripetuta per verificare il contenimento del testo nel riquadro`,
      is_root_cause: causeIndex === 11,
    })),
  }))
  const original = structuredClone(branches)
  const figure = buildIshikawaFigure(branches)

  assert.equal(figure.items.length, 8)
  assert.equal(figure.hiddenCount, 8 * (12 - ISHIKAWA_VISIBLE_CAUSES))
  assert.equal(figure.shortLabels, 8 * ISHIKAWA_VISIBLE_CAUSES)
  assert.deepEqual(branches, original)

  const printFigure = buildIshikawaFigure(branches, 2)
  assert.equal(printFigure.hiddenCount, 8 * 10)
  assert.ok(printFigure.diagramHeight < figure.diagramHeight)

  for (const item of figure.items) {
    assert.equal(item.visibleCauses.length, ISHIKAWA_VISIBLE_CAUSES)
    assert.ok(item.visibleCauses.some((cause) => cause.is_root_cause))
    assert.ok(item.cardLeft >= 0)
    assert.ok(item.cardLeft + ISHIKAWA_CARD_WIDTH < ISHIKAWA_FIGURE_WIDTH * 0.83)
    assert.ok(item.top >= 0)
    assert.ok(item.top + item.cardHeight <= figure.diagramHeight)
  }

  for (const side of [true, false]) {
    const cards = figure.items.filter((item) => item.isTop === side)
    for (let index = 1; index < cards.length; index += 1) {
      assert.ok(cards[index - 1].cardLeft + ISHIKAWA_CARD_WIDTH < cards[index].cardLeft)
    }
  }
})

test('empty and single-category figures stay inside their canvas', () => {
  for (const branches of [[], [{ causes: [] }], [{ causes: [{ description: 'Una causa', is_root_cause: false }] }]]) {
    const figure = buildIshikawaFigure(branches)
    assert.equal(figure.hiddenCount, 0)
    assert.ok(figure.diagramHeight > 0)
    assert.ok(figure.items.every((item) => item.top >= 0 && item.top + item.cardHeight <= figure.diagramHeight))
  }
})

test('every supported category count keeps cards separate and inside the canvas', () => {
  for (let count = 1; count <= 8; count += 1) {
    const branches = Array.from({ length: count }, () => ({
      causes: Array.from({ length: 5 }, (_, index) => ({
        description: `Causa ${index + 1}`,
        is_root_cause: false,
      })),
    }))

    for (const visibleLimit of [2, 3]) {
      const figure = buildIshikawaFigure(branches, visibleLimit)
      for (const item of figure.items) {
        assert.ok(item.cardLeft >= 0)
        assert.ok(item.cardLeft + ISHIKAWA_CARD_WIDTH < ISHIKAWA_FIGURE_WIDTH * 0.83)
        assert.ok(item.top >= 0)
        assert.ok(item.top + item.cardHeight <= figure.diagramHeight)
      }
      for (const side of [true, false]) {
        const cards = figure.items.filter((item) => item.isTop === side)
        for (let index = 1; index < cards.length; index += 1) {
          assert.ok(cards[index - 1].cardLeft + ISHIKAWA_CARD_WIDTH < cards[index].cardLeft)
        }
      }
    }
  }
})
