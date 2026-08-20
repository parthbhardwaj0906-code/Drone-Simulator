import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Wifi, WifiOff, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MoveUp, MoveDown } from 'lucide-react';

// --- Scaled-Up Drone Component ---
function UpgradedDrone({ telemetry }) {
  const droneRef = useRef();
  const propRefs = useRef([]);
  const currentPos = useRef(new THREE.Vector3(0, 1.5, 0));
  const targetPos = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame((state, delta) => {
    if (!droneRef.current) return;

    // 1. Target updates from backend
    targetPos.current.set(
      telemetry.position.x,
      telemetry.position.y + 1.5,
      telemetry.position.z
    );

    // Smooth Lerp Position Interpolation
    currentPos.current.lerp(targetPos.current, delta * 8.0);
    droneRef.current.position.copy(currentPos.current);

    // 2. Aerodynamic Banking Tilt
    const targetRoll = -telemetry.velocity.x * 0.35;
    const targetPitch = telemetry.velocity.z * 0.35;
    droneRef.current.rotation.x = THREE.MathUtils.lerp(droneRef.current.rotation.x, targetPitch, delta * 10.0);
    droneRef.current.rotation.z = THREE.MathUtils.lerp(droneRef.current.rotation.z, targetRoll, delta * 10.0);

    // 3. Continuous Turbine Blade Spin
    propRefs.current.forEach((prop) => {
      if (prop) prop.rotation.y += delta * 35.0;
    });

    // 4. Smooth Camera Tracking
    const camTargetX = droneRef.current.position.x;
    const camTargetZ = droneRef.current.position.z + 10;
    const camTargetY = droneRef.current.position.y + 5;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, camTargetX, delta * 4.0);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, camTargetZ, delta * 4.0);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, camTargetY, delta * 4.0);
    state.camera.lookAt(droneRef.current.position);
  });

  const armPositions = [
    [0.95, 0, 0.95],
    [-0.95, 0, 0.95],
    [0.95, 0, -0.95],
    [-0.95, 0, -0.95],
  ];

  return (
    <group ref={droneRef} position={[0, 1.5, 0]} scale={2.2}>
      <spotLight
        position={[0, -0.2, 0]}
        angle={0.6}
        penumbra={0.4}
        intensity={10}
        color="#38bdf8"
        castShadow
      />

      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.55, 32, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.25, 16]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh position={[0, 0.05, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>

      {armPositions.map((pos, idx) => {
        const angle = Math.atan2(pos[2], pos[0]);
        return (
          <mesh
            key={`arm-${idx}`}
            position={[pos[0] / 2, -0.05, pos[2] / 2]}
            rotation={[0, -angle + Math.PI / 4, 0]}
            castShadow
          >
            <boxGeometry args={[0.1, 0.08, 1.3]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
          </mesh>
        );
      })}

      {armPositions.map((pos, idx) => (
        <group key={`turbine-${idx}`} position={pos}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.22, 32, 1, true]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>

          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.18, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
          </mesh>

          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color={idx < 2 ? '#ef4444' : '#22c55e'}
              emissive={idx < 2 ? '#ef4444' : '#22c55e'}
              emissiveIntensity={2.5}
            />
          </mesh>

          <group ref={(el) => (propRefs.current[idx] = el)} position={[0, 0.02, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.78, 0.015, 0.07]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.3} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[0.78, 0.015, 0.07]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.3} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

// --- Clean Flat Grass Ground ---
function GrassTerrain() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.9} metalness={0.1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <ringGeometry args={[2.0, 2.3, 32]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// --- Main App ---
export default function DroneController() {
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState({
    position: { x: 0, y: 1, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
  });

  const ws = useRef(null);
  const activeKeys = useRef(new Set());

  // Button interaction handlers for on-screen controls
  const handlePressStart = (key) => {
    activeKeys.current.add(key);
  };

  const handlePressEnd = (key) => {
    activeKeys.current.delete(key);
  };

  useEffect(() => {
    const socketUrl = 'ws://localhost:8000/ws/drone';
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => setConnected(true);
    ws.current.onclose = () => setConnected(false);
    ws.current.onmessage = (e) => setTelemetry(JSON.parse(e.data));

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        activeKeys.current.add(key);
      }
    };

    const handleKeyUp = (e) => {
      activeKeys.current.delete(e.key.toLowerCase());
    };

    // Send input vector payload every 33ms (~30 FPS network tick)
    const interval = setInterval(() => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

      const inputVector = {
        forward: activeKeys.current.has('w') || activeKeys.current.has('arrowup') ? 1 : 0,
        backward: activeKeys.current.has('s') || activeKeys.current.has('arrowdown') ? 1 : 0,
        left: activeKeys.current.has('a') || activeKeys.current.has('arrowleft') ? 1 : 0,
        right: activeKeys.current.has('d') || activeKeys.current.has('arrowright') ? 1 : 0,
        up: activeKeys.current.has('q') ? 1 : 0,
        down: activeKeys.current.has('e') ? 1 : 0,
      };

      ws.current.send(JSON.stringify(inputVector));
    }, 33);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      ws.current?.close();
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-sky-900 overflow-hidden font-sans select-none">
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {connected ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide uppercase">3D Flight Simulator</h1>
            <p className="text-xs text-slate-400">{connected ? 'TELEMETRY ONLINE' : 'DISCONNECTED'}</p>
          </div>
        </div>

        <div className="flex gap-6 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">COORDINATES</span>
            <span className="text-slate-200">
              {telemetry.position.x.toFixed(1)}, {telemetry.position.y.toFixed(1)}, {telemetry.position.z.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <Canvas shadows camera={{ position: [0, 6, 12], fov: 45 }}>
        <Sky sunPosition={[100, 40, 100]} mieCoefficient={0.005} mieDirectionalG={0.8} rayleigh={0.5} />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[50, 80, 50]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <UpgradedDrone telemetry={telemetry} />
        <GrassTerrain />

        <OrbitControls makeDefault enablePan={false} maxPolarAngle={Math.PI / 2 - 0.01} />
      </Canvas>

      {/* Interactive On-Screen Controls */}
      <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-between items-end pointer-events-none">
        <div className="grid grid-cols-3 gap-2 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800 pointer-events-auto text-white">
          <div />
          <button
            onMouseDown={() => handlePressStart('w')}
            onMouseUp={() => handlePressEnd('w')}
            onTouchStart={() => handlePressStart('w')}
            onTouchEnd={() => handlePressEnd('w')}
            className="p-4 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-xl flex justify-center transition cursor-pointer"
          >
            <ArrowUp size={20} />
          </button>
          <div />
          <button
            onMouseDown={() => handlePressStart('a')}
            onMouseUp={() => handlePressEnd('a')}
            onTouchStart={() => handlePressStart('a')}
            onTouchEnd={() => handlePressEnd('a')}
            className="p-4 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-xl flex justify-center transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="p-4 flex items-center justify-center text-xs text-slate-400 font-bold">WASD</div>
          <button
            onMouseDown={() => handlePressStart('d')}
            onMouseUp={() => handlePressEnd('d')}
            onTouchStart={() => handlePressStart('d')}
            onTouchEnd={() => handlePressEnd('d')}
            className="p-4 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-xl flex justify-center transition cursor-pointer"
          >
            <ArrowRight size={20} />
          </button>
          <div />
          <button
            onMouseDown={() => handlePressStart('s')}
            onMouseUp={() => handlePressEnd('s')}
            onTouchStart={() => handlePressStart('s')}
            onTouchEnd={() => handlePressEnd('s')}
            className="p-4 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-xl flex justify-center transition cursor-pointer"
          >
            <ArrowDown size={20} />
          </button>
          <div />
        </div>

        <div className="flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800 pointer-events-auto text-white">
          <button
            onMouseDown={() => handlePressStart('q')}
            onMouseUp={() => handlePressEnd('q')}
            onTouchStart={() => handlePressStart('q')}
            onTouchEnd={() => handlePressEnd('q')}
            className="p-4 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <MoveUp size={20} /> <span className="text-xs font-bold">Q</span>
          </button>
          <button
            onMouseDown={() => handlePressStart('e')}
            onMouseUp={() => handlePressEnd('e')}
            onTouchStart={() => handlePressStart('e')}
            onTouchEnd={() => handlePressEnd('e')}
            className="p-4 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <MoveDown size={20} /> <span className="text-xs font-bold">E</span>
          </button>
        </div>
      </div>
    </div>
  );
}