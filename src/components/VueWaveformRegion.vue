<template>
  <div ref="container" class="relative w-full">
    <input 
      type="file" 
      accept="audio/*" 
      @change="handleFileUpload" 
      class="mb-4 block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-violet-50 file:text-violet-700
        hover:file:bg-violet-100"
    />
    <div ref="svgContainer" class="relative">
      <div ref="waveformContainer" class="w-full h-32 bg-gray-800 rounded-lg"></div>
      <div 
        v-if="audioBuffer"
        class="absolute h-8 w-1 bg-gray-600 cursor-ew-resize top-1/2 -translate-y-1/2"
        :style="{ left: `${selectionStart}px` }"
        @mousedown="startDragging('start')"
      ></div>
      <div 
        v-if="audioBuffer"
        class="absolute h-8 w-1 bg-gray-600 cursor-ew-resize top-1/2 -translate-y-1/2"
        :style="{ left: `${selectionStart + selectionWidth}px` }"
        @mousedown="startDragging('end')"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { SVG } from '@svgdotjs/svg.js';

const container = ref<HTMLDivElement | null>(null);
const waveformContainer = ref<HTMLDivElement | null>(null);
const audioContext = ref<AudioContext | null>(null);
const audioBuffer = ref<AudioBuffer | null>(null);
const draw = ref<any>(null);
const waveformPath = ref<any>(null);
const selectionRect = ref<any>(null);

const svgWidth = 1000;
const svgHeight = 128;

const selectionStart = ref(0);
const selectionWidth = ref(0);
const isDragging = ref<'start' | 'end' | null>(null);
const initialStart = ref(0);
const initialWidth = ref(0);

const generateWaveformPath = (data: Float32Array) => {
  const step = Math.ceil(data.length / svgWidth);
  const amp = svgHeight / 2;
  let pathData = `M 0 ${amp}`;

  for (let i = 0; i < svgWidth; i++) {
    let min = 1.0;
    let max = -1.0;
    
    for (let j = 0; j < step; j++) {
      const datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    
    pathData += ` L ${i} ${(1 + min) * amp} L ${i} ${(1 + max) * amp}`;
  }

  return pathData;
};

const updateWaveform = () => {
  if (!waveformPath.value || !selectionRect.value) return;
  
  // Update the clip path
  const clipPath = draw.value.clip().add(
    draw.value.rect(selectionWidth.value, svgHeight).move(selectionStart.value, 0)
  );
  waveformPath.value.clipWith(clipPath);
  
  // Update selection rectangle
  selectionRect.value
    .move(selectionStart.value, 0)
    .width(selectionWidth.value);
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;

  if (!audioContext.value) {
    audioContext.value = new AudioContext();
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    audioBuffer.value = await audioContext.value.decodeAudioData(arrayBuffer);
    const audioData = audioBuffer.value.getformPath(audioData);
    
    // Clear previous SVG content
    if (waveformContainer.value) {
      waveformContainer.value.innerHTML = '';
      
      // Initialize SVG.js
      draw.value = SVG().addTo(waveformContainer.value).size('100%', svgHeight);
      
      // Create selection rectangle
      selectionRect.value = draw.value
        .rect(svgWidth, svgHeight)
        .fill('#F6B637')
        .opacity(0.5);
      
      // Create waveform path
      waveformPath.value = draw.value
        .path(pathData)
        .stroke({ color: '#ffffff', width: 1 })
        .fill('none');
      
      // Set initial selection
      selectionStart.value = 0;
      selectionWidth.value = waveformContainer.value.clientWidth;
      updateWaveform();
    }
  } catch (error) {
    console.error('Error loading audio file:', error);
  }
};

const startDragging = (handle: 'start' | 'end') => {
  isDragging.value = handle;
  initialStart.value = selectionStart.value;
  initialWidth.value = selectionWidth.value;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !waveformContainer.value) return;

  const rect = waveformContainer.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));

  if (isDragging.value === 'start') {
    const newStart = Math.min(x, initialStart.value + initialWidth.value - 20);
    const newWidth = initialStart.value + initialWidth.value - newStart;
    selectionStart.value = newStart;
    selectionWidth.value = newWidth;
  } else {
    const newWidth = Math.max(20, Math.min(x - selectionStart.value, rect.width - selectionStart.value));
    selectionWidth.value = newWidth;
  }
  
  updateWaveform();
};

const handleMouseUp = () => {
  isDragging.value = null;
};

const handleResize = () => {
  if (audioBuffer.value && waveformContainer.value) {
    const rect = waveformContainer.value.getBoundingClientRect();
    selectionWidth.value = Math.min(selectionWidth.value, rect.width - selectionStart.value);
    updateWaveform();
  }
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('resize', handleResize);
  if (audioContext.value) {
    audioContext.value.close();
  }
});
</script>