"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";

function Mesh({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/** Interactive preview of a decimated GLB. The original STL/3MF is never sent to the browser. */
export function ModelViewer({ url }: { url: string }) {
  return (
    <div className="aspect-square w-full rounded-lg bg-zinc-100 overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.2}>
            <Center>
              <Mesh url={url} />
            </Center>
          </Bounds>
          <Environment preset="city" />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
