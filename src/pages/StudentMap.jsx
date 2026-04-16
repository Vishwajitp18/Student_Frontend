import MapView from "../components/MapView";

export default function StudentMap() {
  return (
    <div className="h-screen bg-black text-white">
      <div className="p-4 text-lg font-bold">
        🚌 VIT Shuttle Live Tracking
      </div>
      <MapView />
    </div>
  );
}