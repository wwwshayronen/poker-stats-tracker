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
    <div ref="waveformContainer" class="absolute inset-0 mt-12"></div>
    <svg ref="svgContainer" class="absolute inset-0 mt-12" :width="width" :height="height"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import WaveSurfer from 'wavesurfer.js';
import { SVG } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.draggable.js';

const container = ref<HTMLDivElement | null>(null);
const waveformContainer = ref<HTMLDivElement | null>(null);
const svgContainer = ref<SVGElement | null>(null);
const width = ref(800);
const height = ref(128);

let wavesurfer: WaveSurfer | null = null;
let svg: any = null;
let region: any = null;
let leftHandle: any = null;
let rightHandle: any = null;
let audioBuffer: AudioBuffer | null = null;

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file && wavesurfer) {
    const url = URL.createObjectURL(file);
    wavesurfer.load(url);
  }
};

const initWaveSurfer = () => {
  if (!waveformContainer.value) return;

  wavesurfer = WaveSurfer.create({
    container: waveformContainer.value,
    waveColor: '#ff0000',
    progressColor: '#ff6666',
    height: height.value,
    normalize: true,
    interact: false,
    backend: 'WebAudio'
  });

  wavesurfer.on('ready', () => {
    audioBuffer = wavesurfer.getDecodedData();
  });
};

const updateWaveformView = () => {
  if (!wavesurfer || !audioBuffer) return;

  const start = leftHandle.cx() / width.value;
  const end = rightHandle.cx() / width.value;
  
  // Create a new AudioBuffer with the trimmed data
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(start * audioBuffer.length);
  const endSample = Math.floor(end * audioBuffer.length);
  
  // Update the waveform display
  wavesurfer.regions.clear();
  wavesurfer.regions.add({
    start: start * audioBuffer.duration,
    end: end * audioBuffer.duration,
    color: 'rgba(0, 0, 0, 0.1)',
    drag: false,
    resize: false
  });
};

const initSVG = () => {
  if (!svgContainer.value) return;

  svg = SVG(svgContainer.value);
  
  // Create the draggable region
  region = svg.rect(width.value, height.value)
    .fill('#F6B637')
    .opacity(0.3)
    .radius(8);

  // Add left handle
  leftHandle = svg.group();
  leftHandle.rect(4, 32)
    .fill('#4B5563')
    .center(0, height.value / 2)
    .radius(2);
  
  // Add right handle
  rightHandle = svg.group();
  rightHandle.rect(4, 32)
    .fill('#4B5563')
    .center(width.value, height.value / 2)
    .radius(2);

  // Make handles draggable
  leftHandle.draggable()
    .on('dragmove', (e: any) => {
      const newX = Math.max(0, Math.min(e.detail.box.x, rightHandle.cx() - 20));
      leftHandle.center(newX, height.value / 2);
      
      // Update region position and width
      region.x(newX);
      region.width(rightHandle.cx() - newX);
      
      // Update waveform view
      updateWaveformView();
    });

  rightHandle.draggable()
    .on('dragmove', (e: any) => {
      const newX = Math.max(leftHandle.cx() + 20, Math.min(e.detail.box.x, width.value));
      rightHandle.center(newX, height.value / 2);
      region.width(newX - region.x());
      
      // Update waveform view
      updateWaveformView();
    });
};

onMounted(() => {
  // Delay initialization to ensure proper mounting
  setTimeout(() => {
    initWaveSurfer();
    initSVG();
  }, 100);
});

onBeforeUnmount(() => {
  if (wavesurfer) {
    wavesurfer.destroy();
  }
});
</script>

<style scoped>
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}
.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.w-full {
  width: 100%;
}
.mb-4 {
  margin-bottom: 1rem;
}
.mt-12 {
  margin-top: 3rem;
}
</style>