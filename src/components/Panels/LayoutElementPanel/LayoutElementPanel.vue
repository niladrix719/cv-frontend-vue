<template>
  <div class="noSelect defaultCursor layoutElementPanel draggable-panel draggable-panel-css">
    <div class="panel-header">
      Layout Elements
      <span class="fas fa-minus-square minimize"></span>
      <span class="fas fa-external-link-square-alt maximize"></span>
    </div>
    <div class="panel-body">
      <div class="search-results"></div>
      <div class="accordion">
        <div v-for="(elements, el) in circuitElementList" :key="el">
          <div v-if="elements.length > 0 && elements[0].canShowInSubcircuit" class="panelHeader">{{ el }}s</div>
          <div v-if="elements.length > 0 && elements[0].canShowInSubcircuit" class="panel">
            <div v-for="(element, i) in elements" :key="i" class="icon subcircuitModule"
              @mousedown="selectElement(el, i)" v-if="!element.subcircuitMetadata.showInSubcircuit">
              <img :src="`/img/${el}.svg`">
              <p class="img__description">{{ element.label !== '' ? element.label : 'unlabeled' }}</p>
            </div>
          </div>
        </div>
        <p v-if="!subCircuitElementExists">No layout elements available</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import metadata from '../../../simulator/src/metadata.json';

const circuitElementList = ref(metadata.circuitElementList);

const subCircuitElementExists = computed(() => {
  for (let el in circuitElementList) {
    if (globalScope[el].length > 0 && globalScope[el][0].canShowInSubcircuit) {
      return true;
    }
  }
  return false;
});

function selectElement(elementName, elementIndex) {
  let element = globalScope[elementName][elementIndex];

  element.subcircuitMetadata.showInSubcircuit = true;
  element.newElement = true;
  simulationArea.lastSelected = element;
}
</script>