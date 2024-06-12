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
        <div v-for="el in filteredList" :key="el">
          <div class="panelHeader">{{ el }}s</div>
          <div class="panel">
            <div v-for="(element, index) in globalScope[el]" :key="index"
              v-if="!element.subcircuitMetadata.showInSubcircuit" class="icon subcircuitModule" :id="`${el}-${index}`"
              :data-element-id="index" :data-element-name="el" @mousedown="() => selectElement(el, index)">
              <img :src="`/img/${el}.svg`" />
              <p class="img__description">{{ element.label || 'unlabeled' }}</p>
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
import simulationArea from '#/simulator/src/simulationArea'

const circuitElementList = ref(metadata.circuitElementList);

const subCircuitElementExists = computed(() => {
  return circuitElementList.value.some(el =>
    globalScope[el].some(element => element.canShowInSubcircuit && !element.subcircuitMetadata.showInSubcircuit)
  );
});

const filteredList = computed(() => {
  return circuitElementList.value.filter(el =>
    globalScope[el]?.length > 0 && globalScope[el][0]?.canShowInSubcircuit
  );
});

function selectElement(elementName, elementIndex) {
  let element = globalScope[elementName][elementIndex];

  element.subcircuitMetadata.showInSubcircuit = true;
  element.newElement = true;
  simulationArea.lastSelected = element;
}

</script>