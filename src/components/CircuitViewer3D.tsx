import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CircuitInfo, RaceScenario, RivalCar } from '../types/strategy';
import {
  RotateCcw,
  Compass,
  Eye,
  Layers,
  MapPin,
  CloudRain,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface CircuitViewer3DProps {
  circuit: CircuitInfo;
  scenario: RaceScenario;
  onSelectCar?: (carId: string) => void;
  selectedCarId?: string;
}

export const CircuitViewer3D: React.FC<CircuitViewer3DProps> = ({
  circuit,
  scenario,
  onSelectCar,
  selectedCarId = 'player'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // View state
  const [viewMode, setViewMode] = useState<'3d' | 'overhead'>('3d');
  const [followCar, setFollowCar] = useState<boolean>(false);
  const [selectedCar, setSelectedCar] = useState<string>(selectedCarId);

  // References to mutable Three.js scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const carsMeshRef = useRef<Map<string, THREE.Group>>(new Map());
  const safetyCarMeshRef = useRef<THREE.Group | null>(null);
  const rainSystemRef = useRef<THREE.Points | null>(null);
  const trackCenterRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 240, theta: Math.PI / 4, phi: Math.PI / 3.2 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Animation progress
  const animTimeRef = useRef(0);

  // Initialize Three.js scene and rebuild when circuit changes
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0c0f17); // Deep cockpit navy
    scene.fog = new THREE.FogExp2(0x0c0f17, 0.0025);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    sunLight.position.set(200, 300, 150);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const blueRimLight = new THREE.DirectionalLight(0x00f0ff, 0.6);
    blueRimLight.position.set(-200, -100, -200);
    scene.add(blueRimLight);

    // 5. Track spline construction
    // Normalize coordinates and center them
    const points2D = circuit.trackPath2D;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points2D.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const scale = 220 / Math.max(maxX - minX, maxY - minY);

    const points3D: THREE.Vector3[] = points2D.map(([x, y], idx) => {
      const normX = (x - centerX) * scale;
      const normZ = (y - centerY) * scale;
      // Add subtle procedural elevation based on circuit
      let elevationY = 0;
      if (circuit.id === 'monaco') {
        // Beau Rivage climb, downhill through Mirabeau to chicane
        elevationY = Math.sin((idx / points2D.length) * Math.PI * 2) * 14;
      } else if (circuit.id === 'baku') {
        elevationY = Math.cos((idx / points2D.length) * Math.PI) * 5;
      } else if (circuit.id === 'madrid') {
        elevationY = Math.sin((idx / points2D.length) * Math.PI * 3) * 8;
      }
      return new THREE.Vector3(normX, elevationY, normZ);
    });

    const curve = new THREE.CatmullRomCurve3(points3D, true, 'centripetal', 0.25);
    curveRef.current = curve;
    trackCenterRef.current.set(0, 0, 0);

    // 6. Ground grid plate
    const gridHelper = new THREE.GridHelper(500, 50, 0x1e293b, 0x111827);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // 7. Track Ribbon (Procedural mesh with asphalt, curbs, and white track lines)
    const trackSegments = 300;
    const trackWidth = 7.0;

    // Track Asphalt geometry
    const trackGeo = new THREE.TubeGeometry(curve, trackSegments, trackWidth / 2, 8, true);
    // Flatten tube slightly to form a road surface
    const posAttr = trackGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      posAttr.setY(i, y * 0.25); // Squash vertical profile to look like flat tarmac
    }
    trackGeo.computeVertexNormals();

    const isWet = scenario.currentTrackWetnessPercent > 20;
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x1c212d,
      roughness: isWet ? 0.2 : 0.75,
      metalness: isWet ? 0.4 : 0.1
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    scene.add(trackMesh);

    // Inner & Outer Curbs (Kerbs) with red/white vertex pattern
    const curbGeo = new THREE.TubeGeometry(curve, trackSegments, (trackWidth / 2) + 0.6, 6, true);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      roughness: 0.6
    });
    const curbMesh = new THREE.Mesh(curbGeo, curbMat);
    curbMesh.position.y = -0.15;
    scene.add(curbMesh);

    // Start / Finish Line Gantry
    const startPos = curve.getPointAt(0);
    const startTangent = curve.getTangentAt(0).normalize();
    const startNormal = new THREE.Vector3(-startTangent.z, 0, startTangent.x).normalize();

    const gantryGeo = new THREE.BoxGeometry(trackWidth + 6, 6, 1.2);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const gantry = new THREE.Mesh(gantryGeo, gantryMat);
    gantry.position.copy(startPos).add(new THREE.Vector3(0, 4.5, 0));
    gantry.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), startNormal);
    scene.add(gantry);

    // Chequered banner texture on gantry
    const bannerGeo = new THREE.PlaneGeometry(trackWidth + 2, 1.8);
    const bannerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.copy(gantry.position);
    banner.position.y += 0.2;
    scene.add(banner);

    // Sector Checkpoints (Sector 1 at 33%, Sector 2 at 66%)
    const createSectorMarker = (pct: number, label: string, color: number) => {
      const pos = curve.getPointAt(pct);
      const markerGroup = new THREE.Group();
      const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      const postMat = new THREE.MeshBasicMaterial({ color });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.copy(pos).add(new THREE.Vector3(0, 2, 0));
      markerGroup.add(post);

      const beaconGeo = new THREE.SphereGeometry(0.8, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(pos).add(new THREE.Vector3(0, 4.2, 0));
      markerGroup.add(beacon);

      scene.add(markerGroup);
    };

    createSectorMarker(0.33, 'S1', 0x38bdf8); // Sector 1 Blue
    createSectorMarker(0.66, 'S2', 0xeab308); // Sector 2 Yellow

    // 8. Procedural Car Mesh Generator
    const createF1CarMesh = (colorHex: number, isOurCar: boolean = false): THREE.Group => {
      const carGroup = new THREE.Group();

      // Main Chassis / Monocoque
      const chassisGeo = new THREE.BoxGeometry(1.6, 0.7, 4.2);
      const chassisMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.7
      });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      chassis.position.y = 0.55;
      carGroup.add(chassis);

      // Nosecone
      const noseGeo = new THREE.ConeGeometry(0.6, 2.2, 4);
      const noseMat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.7 });
      const nose = new THREE.Mesh(noseGeo, noseMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0.45, 2.6);
      carGroup.add(nose);

      // Front Wing
      const frontWingGeo = new THREE.BoxGeometry(3.0, 0.15, 0.8);
      const frontWingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const frontWing = new THREE.Mesh(frontWingGeo, frontWingMat);
      frontWing.position.set(0, 0.25, 3.4);
      carGroup.add(frontWing);

      // Rear Wing
      const rearWingGeo = new THREE.BoxGeometry(2.6, 0.8, 0.5);
      const rearWingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const rearWing = new THREE.Mesh(rearWingGeo, rearWingMat);
      rearWing.position.set(0, 1.2, -1.9);
      carGroup.add(rearWing);

      // Halo Cockpit Guard
      const haloGeo = new THREE.TorusGeometry(0.45, 0.08, 6, 12, Math.PI);
      const haloMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(0, 1.1, 0.5);
      carGroup.add(halo);

      // 4 Tires (Wheels)
      const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.55, 16);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

      const wheelPositions = [
        [-1.3, 0.65, 1.6],
        [1.3, 0.65, 1.6],
        [-1.3, 0.65, -1.5],
        [1.3, 0.65, -1.5]
      ];

      wheelPositions.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        carGroup.add(wheel);
      });

      // Special highlight marker for our car
      if (isOurCar) {
        // Glowing cyan ring above our car
        const ringGeo = new THREE.RingGeometry(1.6, 2.0, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 2.8;
        carGroup.add(ring);

        // Driver beacon light
        const light = new THREE.PointLight(0x00f0ff, 1.5, 12);
        light.position.y = 2.2;
        carGroup.add(light);
      }

      return carGroup;
    };

    // 9. Build Player Car
    carsMeshRef.current.clear();
    const playerMesh = createF1CarMesh(0x00f0ff, true); // Neon cyan for APEX GP Car #7
    scene.add(playerMesh);
    carsMeshRef.current.set('player', playerMesh);

    // Build Rival Cars
    scenario.rivals.forEach((rival: RivalCar) => {
      const colorNum = parseInt(rival.color.replace('#', '0x'), 16) || 0xf59e0b;
      const rivalMesh = createF1CarMesh(colorNum, false);
      scene.add(rivalMesh);
      carsMeshRef.current.set(rival.id, rivalMesh);
    });

    // 10. Safety Car
    const scGroup = new THREE.Group();
    const scBodyGeo = new THREE.BoxGeometry(2.0, 0.9, 4.4);
    const scBodyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
    const scBody = new THREE.Mesh(scBodyGeo, scBodyMat);
    scBody.position.y = 0.7;
    scGroup.add(scBody);

    // Strobe roof bar
    const strobeGeo = new THREE.BoxGeometry(1.2, 0.25, 0.4);
    const strobeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const strobe = new THREE.Mesh(strobeGeo, strobeMat);
    strobe.position.set(0, 1.35, 0);
    scGroup.add(strobe);

    const scLight = new THREE.PointLight(0xf59e0b, 2.0, 15);
    scLight.position.set(0, 1.8, 0);
    scGroup.add(scLight);

    safetyCarMeshRef.current = scGroup;
    scene.add(scGroup);

    // 11. Dynamic Rain Particle System
    if (scenario.currentTrackWetnessPercent > 0 || scenario.rainPeakIntensityPercent > 0) {
      const rainCount = Math.min(2500, Math.max(500, scenario.currentTrackWetnessPercent * 30));
      const rainGeo = new THREE.BufferGeometry();
      const rainPositions = new Float32Array(rainCount * 3);

      for (let i = 0; i < rainCount * 3; i += 3) {
        rainPositions[i] = (Math.random() - 0.5) * 450;
        rainPositions[i + 1] = Math.random() * 150;
        rainPositions[i + 2] = (Math.random() - 0.5) * 450;
      }
      rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

      const rainMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.8,
        transparent: true,
        opacity: Math.min(0.8, Math.max(0.2, scenario.currentTrackWetnessPercent / 100))
      });
      const rainSystem = new THREE.Points(rainGeo, rainMat);
      rainSystemRef.current = rainSystem;
      scene.add(rainSystem);
    }

    // 12. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      animTimeRef.current += delta;

      if (!curveRef.current) return;
      const curveInstance = curveRef.current;

      // Base lap time for animation speed
      const baseLapTime = circuit.baseLapTimeSec;
      const speedScale = 0.035; // Visual speed multiplier
      const isSC = scenario.safetyCarStatus === 'FULL_SC';
      const effectiveSpeed = isSC ? speedScale * 0.65 : speedScale;

      // Update Safety Car
      if (safetyCarMeshRef.current) {
        safetyCarMeshRef.current.visible = isSC;
        if (isSC) {
          // Safety car leads the pack ahead of P1
          const scProgress = (animTimeRef.current * effectiveSpeed + 0.08) % 1.0;
          const scPoint = curveInstance.getPointAt(scProgress);
          const scTangent = curveInstance.getTangentAt(scProgress).normalize();

          safetyCarMeshRef.current.position.copy(scPoint);
          safetyCarMeshRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), scTangent);

          // Strobe blink
          const strobe = safetyCarMeshRef.current.children[1] as THREE.Mesh;
          if (strobe && strobe.material) {
            const isBlink = Math.sin(animTimeRef.current * 16) > 0;
            (strobe.material as THREE.MeshBasicMaterial).color.setHex(isBlink ? 0xf59e0b : 0x451a03);
          }
        }
      }

      // Update Player Car (P3)
      const playerMesh = carsMeshRef.current.get('player');
      if (playerMesh) {
        // Player position along curve
        const ourOffset = 0.02; // P3 slightly behind leader
        const playerProgress = (animTimeRef.current * effectiveSpeed + ourOffset) % 1.0;
        const playerPoint = curveInstance.getPointAt(playerProgress);
        const playerTangent = curveInstance.getTangentAt(playerProgress).normalize();

        playerMesh.position.copy(playerPoint);
        playerMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), playerTangent);

        // Gentle chassis roll into curves
        const playerNormal = new THREE.Vector3(-playerTangent.z, 0, playerTangent.x);
        playerMesh.position.addScaledVector(playerNormal, 0.4); // Drive slightly off center
      }

      // Update Rivals
      scenario.rivals.forEach((rival: RivalCar) => {
        const rivalMesh = carsMeshRef.current.get(rival.id);
        if (rivalMesh) {
          let rivalOffset = 0;
          if (rival.position === 1) rivalOffset = 0.055;
          else if (rival.position === 2) rivalOffset = 0.038;
          else if (rival.position === 4) rivalOffset = -0.015;
          else rivalOffset = -0.038;

          const rivalProgress = Math.abs((animTimeRef.current * effectiveSpeed + rivalOffset) % 1.0);
          const rivalPoint = curveInstance.getPointAt(rivalProgress);
          const rivalTangent = curveInstance.getTangentAt(rivalProgress).normalize();

          rivalMesh.position.copy(rivalPoint);
          rivalMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rivalTangent);

          // If in pit, offset car off the racing line
          if (rival.isInPit) {
            const laneOffset = new THREE.Vector3(-rivalTangent.z, 0, rivalTangent.x).multiplyScalar(4.5);
            rivalMesh.position.add(laneOffset);
          }
        }
      });

      // Update Rain Particles
      if (rainSystemRef.current) {
        const positions = rainSystemRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= delta * 180; // Fall downwards
          if (positions[i] < -5) {
            positions[i] = 130 + Math.random() * 20;
          }
        }
        rainSystemRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Update Camera based on View Mode
      if (cameraRef.current) {
        const cam = cameraRef.current;

        if (viewMode === 'overhead') {
          // Precise 2D Top-down orthographic style view
          cam.position.set(0, 360, 0);
          cam.lookAt(0, 0, 0);
          cam.up.set(0, 0, -1);
        } else if (followCar && playerMesh) {
          // Follow our car from third-person chase cam
          const carPos = playerMesh.position.clone();
          const targetProgress = ((animTimeRef.current * effectiveSpeed + 0.02) % 1.0);
          const forward = curveInstance.getTangentAt(targetProgress).normalize();
          const chaseCamPos = carPos.clone().sub(forward.clone().multiplyScalar(35)).add(new THREE.Vector3(0, 16, 0));

          cam.position.lerp(chaseCamPos, 0.1);
          cam.lookAt(carPos.clone().add(new THREE.Vector3(0, 2, 0)));
          cam.up.set(0, 1, 0);
        } else {
          // Free Orbit View
          const s = sphericalRef.current;
          const x = s.radius * Math.sin(s.phi) * Math.sin(s.theta);
          const y = s.radius * Math.cos(s.phi);
          const z = s.radius * Math.sin(s.phi) * Math.cos(s.theta);

          cam.position.set(x, y, z);
          cam.lookAt(cameraTargetRef.current);
          cam.up.set(0, 1, 0);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 13. Handle Window Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight || 460;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [circuit, scenario.circuitId, scenario.currentTrackWetnessPercent, scenario.safetyCarStatus]);

  // Mouse drag Orbit / Zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'overhead' || followCar) return;
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || viewMode === 'overhead' || followCar) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    sphericalRef.current.theta -= deltaX * 0.008;
    sphericalRef.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, sphericalRef.current.phi - deltaY * 0.008));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    sphericalRef.current.radius = Math.max(70, Math.min(480, sphericalRef.current.radius + e.deltaY * 0.2));
  };

  const resetCamera = () => {
    setFollowCar(false);
    setViewMode('3d');
    sphericalRef.current = { radius: 240, theta: Math.PI / 4, phi: Math.PI / 3.2 };
    cameraTargetRef.current.set(0, 0, 0);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] bg-[#0c0f17] rounded-xl overflow-hidden border border-slate-800 shadow-2xl select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Circuit Information Overlay (Top Left) */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 uppercase">
            3D Telemetry Feed
          </span>
          {scenario.safetyCarStatus === 'FULL_SC' && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-950/90 text-amber-300 border border-amber-600/70 animate-pulse">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              SAFETY CAR ACTIVE
            </span>
          )}
          {scenario.currentTrackWetnessPercent > 15 && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-950/80 text-blue-300 border border-blue-600/70">
              <CloudRain className="w-3 h-3 text-blue-400" />
              WET TRACK ({scenario.currentTrackWetnessPercent}%)
            </span>
          )}
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 shadow-md">
          <div className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {circuit.name}
            <span className="text-xs text-slate-400 font-normal">({circuit.location})</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-3">
            <span>Length: <strong className="text-slate-200">{circuit.lengthKm} km</strong></span>
            <span>Turns: <strong className="text-slate-200">{circuit.turnsCount}</strong></span>
            <span>DRS: <strong className="text-slate-200">{circuit.drsZones} Zones</strong></span>
            <span>Overtaking: <strong className="text-slate-200">{circuit.overtakingDifficulty}</strong></span>
          </div>
          <div className="text-[10px] text-amber-400/90 font-mono mt-1 border-t border-slate-800/80 pt-1">
            ⚠ {circuit.schematicNotice}
          </div>
        </div>
      </div>

      {/* Floating Camera & View Controls (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-lg">
        {/* Overhead 2D Map toggle */}
        <button
          onClick={() => {
            setViewMode(viewMode === '3d' ? 'overhead' : '3d');
            setFollowCar(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded transition-all ${
            viewMode === 'overhead'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle 2D Tactical Overhead Map View"
        >
          <Layers className="w-3.5 h-3.5" />
          {viewMode === 'overhead' ? 'OVERHEAD MAP' : '3D ORBIT'}
        </button>

        {/* Follow Car Toggle */}
        <button
          onClick={() => {
            setFollowCar(!followCar);
            if (!followCar) setViewMode('3d');
          }}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded transition-all ${
            followCar
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Lock camera to follow our car"
        >
          <Eye className="w-3.5 h-3.5" />
          FOLLOW #7
        </button>

        {/* Reset View */}
        <button
          onClick={resetCamera}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Buttons */}
        <button
          onClick={() => {
            sphericalRef.current.radius = Math.max(70, sphericalRef.current.radius - 30);
          }}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            sphericalRef.current.radius = Math.min(480, sphericalRef.current.radius + 30);
          }}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Car Selection Pills / Legend (Bottom Center) */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Track Live:</span>

          {/* Our Car */}
          <button
            onClick={() => onSelectCar && onSelectCar('player')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/80 text-cyan-300 text-[11px] font-mono font-bold hover:bg-cyan-900/60"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
            #7 V. Vance (P3)
          </button>

          {/* Rivals */}
          {scenario.rivals.map((rival) => (
            <button
              key={rival.id}
              onClick={() => onSelectCar && onSelectCar(rival.id)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-mono hover:bg-slate-700/80"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rival.color }} />
              P{rival.position} {rival.name.split(' ')[0]}
              {rival.isInPit && <span className="text-[9px] text-amber-400 font-bold ml-0.5">PIT</span>}
            </button>
          ))}
        </div>

        {/* Navigation Hint */}
        <div className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 hidden md:block">
          Click & Drag: Orbit / Pan | Scroll: Zoom | S1/S2: Split Gates
        </div>
      </div>
    </div>
  );
};
