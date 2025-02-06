import React, { useEffect, useRef } from 'react';
import { createApp } from 'vue';
import VueWaveformRegion from './VueWaveformRegion.vue';

const VueWaveformWrapper = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a new Vue application instance
    const app = createApp(VueWaveformRegion);
    
    // Mount the Vue component to the container
    app.mount(containerRef.current);

    // Cleanup when component unmounts
    return () => {
      app.unmount();
    };
  }, []);

  return <div ref={containerRef} />;
};

export default VueWaveformWrapper;