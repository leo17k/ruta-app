import Image from "next/image";

import Nav from "./Componets/Nav";
import MyMap from "./Componets/Mapa";
import ControlledMapExample from "./Componets/mp";
export default function Home() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      {/* Violet Storm Background with Top Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.25), transparent 70%), #000000",
        }}
      />
      <Nav />
      <MyMap />

      {/* Your Content/Components */}
    </div>
  );
}
