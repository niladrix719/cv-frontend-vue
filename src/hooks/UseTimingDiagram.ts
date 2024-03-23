import { ref, reactive, computed, onMounted } from 'vue';
import simulationArea from '../simulator/src/simulationArea';
import { convertors } from '../simulator/src/utils';

const DPR = window.devicePixelRatio || 1;

function sh(x: number): number {
  return x * DPR;
}

export { sh, DPR };

/**
 * Spec Constants
 * Size Spec Diagram - https://app.diagrams.net/#G1HFoesRvNyDap95sNJswTy3nH09emDriC
 * NOTE: Since DPR is set on page load, changing of screen in runtime will not work well
 * @TODO
 *  - Support for color themes
 *  - Replace constants with functions? - Can support Zoom in and Zoom out of canvas then
 */

const frameInterval = 100; // Refresh rate
const timeLineHeight = sh(20);
const padding = sh(2);
const plotHeight = sh(20);
const waveFormPadding = sh(5);
const waveFormHeight = plotHeight - 2 * waveFormPadding;
const flagLabelWidth = sh(75);
const backgroundColor = 'black';
const foregroundColor = '#eee';
const textColor = 'black';
const waveFormColor = 'cyan';
const timeLineStartX = flagLabelWidth + padding;

function getFullHeight(flagCount: number): number {
  return timeLineHeight + (plotHeight + padding) * flagCount;
}

function getFlagStartY(timeLineHeight: number, plotHeight: number, padding: number, flagIndex: number): number {
  return getFullHeight(flagIndex) + padding;
}

function getCycleStartX(timeLineStartX: number, cycleWidth: number, cycleNumber: number, cycleOffset: number): number {
  return timeLineStartX + (cycleNumber - cycleOffset) * cycleWidth;
}

interface PlotArea {
  cycleOffset: number;
  DPR: number;
  canvas: HTMLCanvasElement | null;
  cycleCount: number;
  cycleTime: number;
  executionStartTime: number;
  autoScroll: boolean;
  width: number;
  height: number;
  unitUsed: number;
  cycleUnit: number;
  mouseDown: boolean;
  mouseX: number;
  mouseDownX: number;
  mouseDownTime: number;
  scrollAcc?: number;
  ctx: CanvasRenderingContext2D | null
  timeOutPlot?: NodeJS.Timeout;
  [button: string]: any;
}

export default function useTimingDiagram() {
  const plotArea: PlotArea = reactive({
    cycleOffset: 0,
    DPR: window.devicePixelRatio || 1,
    canvas: document.getElementById("plotArea") as HTMLCanvasElement | null,
    cycleCount: 0,
    cycleTime: 0,
    executionStartTime: 0,
    autoScroll: true,
    width: 0,
    height: 0,
    unitUsed: 0,
    cycleUnit: 1000,
    mouseDown: false,
    mouseX: 0,
    mouseDownX: 0,
    mouseDownTime: 0,
    ctx: null,
  });

  const cycleWidth = ref(sh(30));
  const cycleUnits = ref(sh(1000))
  const plotWidth = ref(sh(560));
  const plotHeight = ref(sh(20));
  const canvasWidth = ref(sh(560));
  const canvasHeight = ref(sh(20));

  const reset = () => {
    plotArea.cycleCount = 0;
    plotArea.cycleTime = Date.now();
    for (let i = 0; i < globalScope.Flag.length; i++) {
      globalScope.Flag[i].plotValues = [
        [0, globalScope.Flag[i].inp1.value],
      ];
      globalScope.Flag[i].cachedIndex = 0;
    }
    plotArea.unitUsed = 0;
    resume();
    resize();
  };

  const resume = () => {
    plotArea.autoScroll = true;
  };

  const pause = () => {
    plotArea.autoScroll = false;
    plotArea.scrollAcc = 0;
  };

  const nextCycle = () => {
    plotArea.cycleCount++;
    plotArea.cycleTime = Date.now();
  };

  const setExecutionTime = () => {
    plotArea.executionStartTime = Date.now();
  };

  const zoomIn = () => {
    cycleWidth.value += sh(2);
  };

  const zoomOut = () => {
    cycleWidth.value -= sh(2);
  };

  const download = () => {
    if (plotArea.canvas) {
      const img = plotArea.canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = img;
      anchor.download = 'waveform.png';
      anchor.click();
    } else {
      console.error('Canvas element is not initialized.');
    }
  };

  const resize = () => {
    // alert('resize')
    const oldHeight = plotArea.height
    const oldWidth = plotArea.width
    plotArea.width = plotWidth.value * DPR
    plotArea.height = getFullHeight(globalScope.Flag.length)
    if (oldHeight == plotArea.height && oldWidth == plotArea.width) return
    canvasWidth.value = plotArea.width
    canvasHeight.value = plotArea.height
    plot();
  }

  const setup = () => {
    if (!embed) {
      plotArea.ctx = plotArea.canvas?.getContext('2d') ?? null;
    }
    plotArea.timeOutPlot = setInterval(() => {
      plot();
    }, frameInterval);
    reset();
  };

  const getPlotTime = (timeUnit: number) => {
    let time = plotArea.cycleCount; // Current cycle count
    time += timeUnit / plotArea.cycleUnit; // Add propagation delay

    // For user interactions like buttons - calculate time since clock tick
    const timePeriod = simulationArea.timePeriod;
    const executionDelay = plotArea.executionStartTime - plotArea.cycleTime;
    const delayFraction = executionDelay / timePeriod;

    // Add time since clock tick
    time += delayFraction;
    return time;
  };

  const calibrate = () => {
    const recommendedUnit = Math.max(20, Math.round(plotArea.unitUsed * 3));
    plotArea.cycleUnit = recommendedUnit;
    // Update UI if necessary
    // $('#timing-diagram-units').val(recommendedUnit); // Assuming this updates some UI element
    reset();
  };

  const getCurrentTime = () => {
    let time = plotArea.cycleCount;
    const timePeriod = simulationArea.timePeriod;
    const delay = Date.now() - plotArea.cycleTime;
    const delayFraction = delay / timePeriod;
    time += delayFraction;
    return time;
  };

  const update = () => {
    resize();
    plotArea.unitUsed = Math.max(plotArea.unitUsed, simulationArea.simulationQueue.time);

    // Update UI using refs
    const timingDiagramLog = document.getElementById('timing-diagram-log');
    if (timingDiagramLog) {
      timingDiagramLog.innerHTML = `Utilization: ${Math.round(plotArea.unitUsed)} Units (${utilization.value}%)`;
      timingDiagramLog.style.backgroundColor = backgroundColor;
      if (showRecommendedUnits.value) {
        timingDiagramLog.innerHTML += ` Recommended Units: ${recommendedUnit.value}`;
      }
    }

    const width = plotArea.width;
    const endTime = getCurrentTime();

    if (plotArea.autoScroll) {
      plotArea.cycleOffset = Math.max(0, endTime - (width - timeLineStartX) / cycleWidth.value);
    } else if (!plotArea.mouseDown) {
      plotArea.cycleOffset -= plotArea.scrollAcc ?? 0;
      plotArea.scrollAcc = plotArea.scrollAcc ?? 0;
      plotArea.scrollAcc *= 0.95;
      if (plotArea.cycleOffset < 0) plotArea.scrollAcc = plotArea.cycleOffset / 5;
      if (Math.abs(plotArea.cycleOffset) < 0.01) plotArea.cycleOffset = 0;
    }
  };

  const render = () => {
    const { width, height } = plotArea;
    canvasHeight.value = height
    canvasWidth.value = width
    const endTime = getCurrentTime()
    // Reset canvas
    clear()

    // Background Color
    plotArea.ctx.fillStyle = backgroundColor
    plotArea.ctx.fillRect(0, 0, width, height)

    plotArea.ctx.lineWidth = sh(1)
    plotArea.ctx.font = `${sh(15)}px Raleway`
    plotArea.ctx.textAlign = 'left'

    // Timeline
    plotArea.ctx.fillStyle = foregroundColor
    plotArea.ctx.fillRect(timeLineStartX, 0, this.canvas.width, timeLineHeight)
    plotArea.ctx.fillRect(0, 0, flagLabelWidth, timeLineHeight)
    plotArea.ctx.fillStyle = textColor
    plotArea.ctx.fillText('Time', sh(5), timeLineHeight * 0.7)

    // Timeline numbers
    plotArea.ctx.font = `${sh(9)}px Times New Roman`
    plotArea.ctx.strokeStyle = textColor
    plotArea.ctx.textAlign = 'center'
    for (
      var i = Math.floor(plotArea.cycleOffset);
      getCycleStartX(i) <= width;
      i++
    ) {
      var x = getCycleStartX(i)
      // Large ticks + number
      // @TODO - collapse number if it doesn't fit
      if (x >= timeLineStartX) {
        plotArea.ctx.fillText(`${i}`, x, timeLineHeight - sh(15) / 2)
        plotArea.ctx.beginPath()
        plotArea.ctx.moveTo(x, timeLineHeight - sh(5))
        plotArea.ctx.lineTo(x, timeLineHeight)
        plotArea.ctx.stroke()
      }
      // Small ticks
      for (var j = 1; j < 5; j++) {
        var x1 = x + Math.round((j * cycleWidth) / 5)
        if (x1 >= timeLineStartX) {
          plotArea.ctx.beginPath()
          plotArea.ctx.moveTo(x1, timeLineHeight - sh(2))
          plotArea.ctx.lineTo(x1, timeLineHeight)
          plotArea.ctx.stroke()
        }
      }
    }

    // Flag Labels
    ctx.textAlign = 'left'
    for (var i = 0; i < globalScope.Flag.length; i++) {
      var startHeight = getFlagStartY(i)
      plotArea.ctx.fillStyle = foregroundColor
      plotArea.ctx.fillRect(0, startHeight, flagLabelWidth, plotHeight)
      plotArea.ctx.fillStyle = textColor
      plotArea.ctx.fillText(
        globalScope.Flag[i].identifier,
        sh(5),
        startHeight + plotHeight * 0.7
      )
    }

    // Waveform Status Flags
    const WAVEFORM_NOT_STARTED = 0
    const WAVEFORM_STARTED = 1
    const WAVEFORM_OVER = 3

    // Waveform
    plotArea.ctx.strokeStyle = waveFormColor
    plotArea.ctx.textAlign = 'center'
    var endX = Math.min(getCycleStartX(endTime), width)

    for (var i = 0; i < globalScope.Flag.length; i++) {
      var plotValues = globalScope.Flag[i].plotValues
      var startHeight = getFlagStartY(i) + waveFormPadding
      var yTop = startHeight
      var yMid = startHeight + waveFormHeight / 2
      var yBottom = startHeight + waveFormHeight
      var state = WAVEFORM_NOT_STARTED
      var prevY

      // Find correct index to start plotting from
      var j = 0
      // Using caching for optimal performance
      if (globalScope.Flag[i].cachedIndex) {
        j = globalScope.Flag[i].cachedIndex
      }
      // Move to beyond timeLineStartX
      while (
        j + 1 < plotValues.length &&
        getCycleStartX(plotValues[j][0]) < timeLineStartX
      ) {
        j++
      }
      // Move to just before timeLineStartX
      while (j > 0 && getCycleStartX(plotValues[j][0]) > timeLineStartX) {
        j--
      }
      // Cache index
      globalScope.Flag[i].cachedIndex = j

      // Plot
      for (; j < plotValues.length; j++) {
        var x = getCycleStartX(plotValues[j][0])

        // Handle out of bound
        if (x < timeLineStartX) {
          if (j + 1 != plotValues.length) {
            // Next one also is out of bound, so skip this one completely
            var x1 = getCycleStartX(plotValues[j + 1][0])
            if (x1 < timeLineStartX) continue
          }
          x = timeLineStartX
        }

        var value = plotValues[j][1]
        if (value === undefined) {
          if (state == WAVEFORM_STARTED) {
            plotArea.ctx.stroke()
          }
          state = WAVEFORM_NOT_STARTED
          continue
        }
        if (globalScope.Flag[i].bitWidth == 1) {
          if (x > endX) break
          var y = value == 1 ? yTop : yBottom
          if (state == WAVEFORM_NOT_STARTED) {
            // Start new plot
            state = WAVEFORM_STARTED
            plotArea.ctx.beginPath()
            plotArea.ctx.moveTo(x, y)
          } else {
            plotArea.ctx.lineTo(x, prevY)
            plotArea.ctx.lineTo(x, y)
          }
          prevY = y
        } else {
          var endX
          if (j + 1 == plotValues.length) {
            endX = getCycleStartX(endTime)
          } else {
            endX = getCycleStartX(plotValues[j + 1][0])
          }
          var smallOffset = waveFormHeight / 2
          plotArea.ctx.beginPath()
          plotArea.ctx.moveTo(endX, yMid)
          plotArea.ctx.lineTo(endX - smallOffset, yTop)
          plotArea.ctx.lineTo(x + smallOffset, yTop)
          plotArea.ctx.lineTo(x, yMid)
          plotArea.ctx.lineTo(x + smallOffset, yBottom)
          plotArea.ctx.lineTo(endX - smallOffset, yBottom)
          plotArea.ctx.closePath()
          plotArea.ctx.stroke()

          // Text position
          // Clamp start and end are within the screen
          var x1 = Math.max(x, timeLineStartX)
          var x2 = Math.min(endX, width)
          var textPositionX = (x1 + x2) / 2

          plotArea.ctx.font = `${sh(9)}px Times New Roman`
          plotArea.ctx.fillStyle = 'white'
          plotArea.ctx.fillText(
            convertors.dec2hex(value),
            textPositionX,
            yMid + sh(3)
          )
        }
        if (x > width) {
          state = WAVEFORM_OVER
          plotArea.ctx.stroke()
          break
        }
      }
      if (state == WAVEFORM_STARTED) {
        if (globalScope.Flag[i].bitWidth == 1) {
          plotArea.ctx.lineTo(endX, prevY)
        }
        plotArea.ctx.stroke()
      }
    }
  }

  const plot = () => {
    if (embed) return
    if (globalScope.Flag.length === 0) {
      canvasWidth.value = 0
      canvasHeight.value = 0
      return
    }

    update()
    render()
  }

  const clear = () => {
    plotArea.ctx?.clearRect(0, 0, plotArea.canvas.width, plotArea.canvas.height)
  }

  return {
    plotArea,
    cycleWidth,
    cycleUnits,
    plotWidth,
    plotHeight,
    canvasWidth,
    canvasHeight,
    reset,
    resume,
    pause,
    nextCycle,
    setExecutionTime,
    zoomIn,
    zoomOut,
    download,
    resize,
    setup,
    getPlotTime,
    calibrate,
    getCurrentTime,
    update,
    render,
    plot,
    clear,
  };
}