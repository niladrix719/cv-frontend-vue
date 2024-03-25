import { expect, test } from 'vitest'
import ContextMenue from '../../../src/components/ContextMenu/ContextMenu.vue'
import vuetify from "../../../src/plugins/vuetify"

test('ContextMenu.vue', () => {
    expect(ContextMenue).toBeTruthy()
})
