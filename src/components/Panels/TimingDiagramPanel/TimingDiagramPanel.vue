<template>
    <div class="timing-diagram-panel draggable-panel">
        <!-- Timing Diagram Panel -->
        <PanelHeader :header-title="$t('simulator.panel_header.timing_diagram')" />
        <div class="panel-body">
            <div class="timing-diagram-toolbar noSelect">
                <TimingDiagramButtons v-for="button in buttons" :key="button.title" :title="button.title"
                    :icon="button.icon" :btn-class="button.class" class="timing-diagram-panel-button"
                    :type="button.type" @click="() => {
            handleButtonClick(button.click)
        }
            " />
                {{ $t('simulator.panel_body.timing_diagram.one_cycle') }}
                <input id="timing-diagram-units" type="number" min="1" autocomplete="off" :value="cycleUnits"
                    @change="handleUnitsChange" @paste="handleUnitsChange" @keyup="handleUnitsChange" />
                {{ $t('simulator.panel_body.timing_diagram.units') }}
                <span id="timing-diagram-log"
                    :style="{ backgroundColor: (utilization >= 90 || utilization <= 10) ? dangerColor : normalColor }">
                    Utilization: {{ Math.round(plotArea.unitUsed) }} Units ({{ utilization }}%)
                    {{ (utilization >= 90 || utilization <= 10) ? `Recommended Units: ${recommendedUnit}` : '' }}
                        </span>
            </div>
            <div id="plot" :style="{ width: plotWidth + 'px', height: plotHeight + 'px' }">
                <canvas id="plotArea" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"
                    :style="{ backgroundColor: 'red', width: canvasWidth + 'px', height: canvasHeight + 'px' }"></canvas>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import _plotArea from '#/simulator/src/plotArea'
import { sh, DPR, cycleWidth, frameInterval, timeLineHeight, padding, timeLineStartX } from '#/simulator/src/plotArea'
import TimingDiagramButtons from './TimingDiagramButtons.vue'
import buttonsJSON from '#/assets/constants/Panels/TimingDiagramPanel/buttons.json'
import PanelHeader from '../Shared/PanelHeader.vue'
import embed from '#/pages/embed.vue'
import useTimingDiagram from '../../../hooks/UseTimingDiagram'

interface TimingDiagramButton {
    title: string
    icon: string
    class: string
    type: string
    click: string
}

const { 
    plotArea,
    resize,
    plotHeight,
    plotWidth,
    canvasWidth,
    canvasHeight,
    cycleUnits,
} = useTimingDiagram()

const buttons = ref<TimingDiagramButton[]>(buttonsJSON)
const utilization = ref(Math.round((plotArea.unitUsed * 10000) / plotArea.cycleUnit) / 100)
const recommendedUnit = ref(Math.max(20, Math.round(plotArea.unitUsed * 3)))
const dangerColor = '#dc5656'
const normalColor = '#42b983'

function handleButtonClick(button: string) {
    console.log('clicked', button)
    if (button === 'smaller') {
        plotWidth.value = Math.max(plotWidth.value - sh(20), sh(560));
        resize();
    } else if (button === 'larger') {
        plotWidth.value += sh(20);
        resize();
    } else if (button === 'smallHeight') {
        plotHeight.value = Math.max(plotHeight.value - sh(20), sh(20));
        resize();
    } else if (button === 'largeHeight') {
        plotHeight.value = Math.min(plotHeight.value + sh(20), sh(50));
        resize();
    } else {
        plotArea[button]()
    }
}

function handleUnitsChange(event: Event) {
    const inputElem = event.target as HTMLInputElement
    const timeUnits = parseInt(inputElem.value, 10)
    if (isNaN(timeUnits) || timeUnits < 1) return
    plotArea.cycleUnit = timeUnits
}

function onMouseDown(e: MouseEvent) {
    if (embed) return
    const rect = plotArea.canvas?.getBoundingClientRect()
    const x = sh(e.clientX - (rect?.left ?? 0));
    plotArea.scrollAcc = 0
    plotArea.autoScroll = false
    plotArea.mouseDown = true
    plotArea.mouseX = x
    plotArea.mouseDownX = x
    plotArea.mouseDownTime = new Date().getTime()
}

function onMouseUp() {
    if (embed) return
    plotArea.mouseDown = false
    const time = new Date().getTime() - plotArea.mouseDownTime
    const offset = (plotArea.mouseX - plotArea.mouseDownX) / cycleWidth
    plotArea.scrollAcc = (offset * frameInterval) / time
}

function onMouseMove(e: MouseEvent) {
    if (embed) return
    const rect = plotArea.canvas?.getBoundingClientRect()
    const x = sh(e.clientX - (rect?.left ?? 0));
    if (plotArea.mouseDown) {
        plotArea.cycleOffset -= (x - plotArea.mouseX) / cycleWidth
        plotArea.mouseX = x
    } else {
        plotArea.mouseDown = false
    }
}

// function getFullHeight(flagCount: number) {
//     return timeLineHeight + (plotHeight.value + padding) * flagCount
// }

// function resize() {
//     const oldHeight = plotArea.height
//     const oldWidth = plotArea.width
//     plotArea.width = plotWidth.value * DPR
//     plotArea.height = getFullHeight(globalScope.Flag.length)
//     if (oldHeight == plotArea.height && oldWidth == plotArea.width) return
//     canvasWidth.value = plotArea.width
//     canvasHeight.value = plotArea.height
//     plot();
// }

// function plot() {
//     if (embed) return
//     if (globalScope.Flag.length === 0) {
//         canvasWidth.value = 0
//         canvasHeight.value = 0
//         return
//     }

//     update()
//     // this.render()
// }

// function update() {
//     resize()
//     plotArea.unitUsed = Math.max(
//         plotArea.unitUsed,
//         simulationArea.simulationQueue.time
//     )

//     if (utilization.value >= 100) {
//         plotArea.clear()
//         return
//     }

//     const width = plotArea.width
//     const endTime = plotArea.getCurrentTime()

//     if (plotArea.autoScroll) {
//         // Formula used:
//         // (endTime - x) * cycleWidth = width - timeLineStartX;
//         // x = endTime - (width - timeLineStartX) / cycleWidth
//         plotArea.cycleOffset = Math.max(
//             0,
//             endTime - (width - timeLineStartX) / cycleWidth
//         )
//     } else if (!plotArea.mouseDown) {
//         // Scroll
//         plotArea.cycleOffset -= plotArea.scrollAcc
//         // Friction
//         plotArea.scrollAcc *= 0.95
//         // No negative numbers allowed, so negative scroll to 0
//         if (plotArea.cycleOffset < 0) plotArea.scrollAcc = plotArea.cycleOffset / 5
//         // Set position to 0, to avoid infinite scrolling
//         if (Math.abs(plotArea.cycleOffset) < 0.01) plotArea.cycleOffset = 0
//     }
// }

// function reset() {
//     plotArea.cycleCount = 0
//     plotArea.cycleTime = new Date().getTime()
//     for (var i = 0; i < globalScope.Flag.length; i++) {
//         globalScope.Flag[i].plotValues = [
//             [0, globalScope.Flag[i].inp1.value],
//         ]
//         globalScope.Flag[i].cachedIndex = 0
//     }
//     plotArea.unitUsed = 0
//     plotArea.resume()
//     resize()
// }
</script>

<style scoped>
.timing-diagram-panel-button {
    margin-right: 5px;
}
</style>

<!-- TODO: input element to vue, remove remaining dom manipulation, header component -->
