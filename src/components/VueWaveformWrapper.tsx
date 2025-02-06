import React, { useEffect, useRef } from 'react';
import { createApp } from 'vue';
import VueWaveformRegion from './VueWaveformRegion.vue';

const VueWaveformWrapper = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a new Vue application instance
    const app = createApp(VueWaveformRegion);
    appRef.current = app;
    
    // Mount the Vue component to the container
    app.mount(containerRef.current);

    // Cleanup when component unmounts
    return () => {
      if (appRef.current) {
        appRef.current.unmount();
      }
    };
  }, []);

  return <div ref={containerRef} className="min-h-[250px]" />;
};

export default VueWaveformWrapper;