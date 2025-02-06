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
    <div class="relative">
      <canvas ref="canvas" class="w-full h-32 bg-gray-50 rounded-lg"></canvas>
      <div 
        v-if="audioBuffer"
        class="absolute inset-0 pointer-events-none"
      >
        <div 
          class="absolute h-full bg-[#F6B637] opacity-30"
          :style="{ left: `${selectionStart}px`, width: `${selectionWidth}px` }"
        ></div>
      </div>
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

const container = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const audioContext = ref<AudioContext | null>(null);
const audioBuffer = ref<AudioBuffer | null>(null);

const selectionStart = ref(0);
const selectionWidth = ref(0);
const isDragging = ref<'start' | 'end' | null>(null);
const dragStartX = ref(0);
const initialStart = ref(0);
const initialWidth = ref(0);

const drawWaveform = () => {
  if (!canvas.value || !audioBuffer.value) return;
  
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  // Set canvas dimensions based on container size
  canvas.value.width = canvas.value.offsetWidth;
  canvas.value.height = canvas.value.offsetHeight;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // Get audio data
  const data = audioBuffer.value.getChannelData(0);
  const step = Math.ceil(data.length / canvas.value.width);
  const amp = canvas.value.height / 2;

  // Draw waveform
  ctx.beginPath();
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 1;

  for (let i = 0; i < canvas.value.width; i++) {
    let min = 1.0;
    let max = -1.0;
    
    for (let j = 0; j < step; j++) {
      const datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    
    ctx.moveTo(i, (1 + min) * amp);
    ctx.lineTo(i, (1 + max) * amp);
  }

  ctx.stroke();
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;

  // Initialize audio context if needed
  if (!audioContext.value) {
    audioContext.value = new AudioContext();
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    audioBuffer.value = await audioContext.value.decodeAudioData(arrayBuffer);
    drawWaveform();
    
    // Set initial selection to full width
    selectionStart.value = 0;
    selectionWidth.value = canvas.value?.offsetWidth || 0;
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
  if (!isDragging.value || !canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, canvas.value.offsetWidth));

  if (isDragging.value === 'start') {
    const newStart = Math.min(x, initialStart.value + initialWidth.value - 20);
    const newWidth = initialStart.value + initialWidth.value - newStart;
    selectionStart.value = newStart;
    selectionWidth.value = newWidth;
  } else {
    const newWidth = Math.max(20, Math.min(x - selectionStart.value, canvas.value.offsetWidth - selectionStart.value));
    selectionWidth.value = newWidth;
  }
};

const handleMouseUp = () => {
  isDragging.value = null;
};

// Handle window resize
const handleResize = () => {
  if (audioBuffer.value) {
    drawWaveform();
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