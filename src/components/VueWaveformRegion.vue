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
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
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
let activeRegion: any = null;

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
    plugins: [
      RegionsPlugin.create()
    ]
  });

  wavesurfer.on('ready', () => {
    // Create initial region spanning the entire track
    if (activeRegion) {
      activeRegion.remove();
    }
    
    activeRegion = wavesurfer.regions.add({
      start: 0,
      end: wavesurfer.getDuration(),
      color: 'rgba(0, 0, 0, 0.1)',
      drag: false,
      resize: false
    });
  });
};

const updateWaveformRegion = (start: number, end: number) => {
  if (!wavesurfer || !activeRegion) return;

  const duration = wavesurfer.getDuration();
  const startTime = (start / width.value) * duration;
  const endTime = (end / width.value) * duration;

  activeRegion.remove();
  activeRegion = wavesurfer.regions.add({
    start: startTime,
    end: endTime,
    color: 'rgba(0, 0, 0, 0.1)',
    drag: false,
    resize: false
  });

  // Update visual overlay
  if (region) {
    region.x(start);
    region.width(end - start);
  }
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
      updateWaveformRegion(newX, rightHandle.cx());
    });

  rightHandle.draggable()
    .on('dragmove', (e: any) => {
      const newX = Math.max(leftHandle.cx() + 20, Math.min(e.detail.box.x, width.value));
      rightHandle.center(newX, height.value / 2);
      updateWaveformRegion(leftHandle.cx(), newX);
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