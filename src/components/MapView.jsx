import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import socket from "../socket/socket";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🚍 Bus Icon
const createBusIcon = (busId) =>
  L.divIcon({
    html: `
      <div class="bus-wrap">
        <div class="bus-box">🚌</div>
        <div class="bus-tail"></div>
        <div class="bus-name">Bus ${busId}</div>
      </div>
    `,
    className: "",
    iconSize: [60, 80],
    iconAnchor: [30, 70],
  });

// 🔥 NORMAL MARKER LAYER (NO CLUSTER)
function MarkerLayer({ buses }) {
  const map = useMap();
  const markersRef = useRef([]);

  useEffect(() => {
    // clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    Object.values(buses).forEach((bus) => {
      if (!bus.position) return;

      const marker = L.marker(bus.position, {
        icon: createBusIcon(bus.busId),
      });

      // 🎯 POPUP UI (UNCHANGED)
      const popupContent = `
        <div style="min-width:190px">

          <b style="font-size:16px">🚌 Bus ${bus.busId}</b><br/>
          <span style="color:#9ca3af;font-size:12px">
            Route: ${bus.routeId}
          </span><br/>

          <span style="color:#22c55e;font-weight:600">
            ETA: 15-20 mins
          </span>

          <br/><br/>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:14px;color:#cbd5f5">👥 People</span>

            <div style="display:flex;align-items:center;gap:10px;">
              <button id="minus-${bus.busId}" style="width:30px;height:30px;border-radius:50%;border:none;background:#1e293b;color:white;font-size:18px;cursor:pointer;">−</button>

              <span id="count-${bus.busId}" style="font-weight:600">1</span>

              <button id="plus-${bus.busId}" style="width:30px;height:30px;border-radius:50%;border:none;background:#2563eb;color:white;font-size:18px;cursor:pointer;">+</button>
            </div>
          </div>

          <p id="amount-${bus.busId}" style="margin:8px 0;font-weight:700;font-size:15px">
             Total: ₹20
          </p>

          <button id="pay-btn-${bus.busId}" style="width:100%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;border:none;padding:12px;border-radius:12px;cursor:pointer;font-weight:600;">
            💳 Pay Now
          </button>

        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("popupopen", () => {
        const minus = document.getElementById(`minus-${bus.busId}`);
        const plus = document.getElementById(`plus-${bus.busId}`);
        const countText = document.getElementById(`count-${bus.busId}`);
        const amountText = document.getElementById(`amount-${bus.busId}`);
        const btn = document.getElementById(`pay-btn-${bus.busId}`);

        let people = 1;

        const updateUI = () => {
          countText.innerText = people;
          amountText.innerText = `Total: ₹${people * 20}`;
        };

        minus.onclick = () => {
          if (people > 1) {
            people--;
            updateUI();
          }
        };

        plus.onclick = () => {
          people++;
          updateUI();
        };

        btn.onclick = () => {
          const total = people * 20;

          const upiUrl = `upi://pay?pa=vitbus@okaxis&pn=VIT%20Shuttle&am=${total}&cu=INR`;

          const intentUrl = `intent://${upiUrl.replace(
            "upi://",
            ""
          )}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;

          window.location.href = intentUrl;

          setTimeout(() => {
            window.location.href = upiUrl;
          }, 1000);
        };
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => map.removeLayer(m));
    };
  }, [buses, map]);

  return null;
}

// 🗺️ MAIN MAP
export default function MapView() {
  const [buses, setBuses] = useState({});

  useEffect(() => {
    socket.on("location-update", (data) => {
      const { busId, latitude, longitude } = data;

      setBuses((prev) => ({
        ...prev,
        [busId]: {
          ...data,
          position: [latitude, longitude],
        },
      }));
    });

    socket.on("clear-map", () => {
      setBuses({});
    });

    return () => {
      socket.off("location-update");
      socket.off("clear-map");
    };
  }, []);

  return (
    <MapContainer
      center={[12.9716, 79.1588]}
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerLayer buses={buses} />
    </MapContainer>
  );
}