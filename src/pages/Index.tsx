import VueWaveformRegion from "@/components/VueWaveformRegion.vue";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl">
        <VueWaveformRegion />
      </div>
    </div>
  );
};

export default Index;