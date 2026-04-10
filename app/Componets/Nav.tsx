"use client";

export default function Nav() {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-transparent">
            {/* Logo / Título */}
            <div className="flex items-center gap-2">

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-map-icon lucide-map"
                >
                    <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
                    <path d="M15 5.764v15" />
                    <path d="M9 3.236v15" />
                </svg>
                <span className="text-white font-medium tracking-widest text-sm uppercase">
                    Ruta
                </span>
            </div>

            {/* Enlaces con Glassmorphism */}
            <div className="hidden md:flex items-center gap-1 p-1 px-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
                {['Rutas', 'Ubers', 'IA', 'Buses'].map((item) => (
                    <a
                        key={item}
                        href={`#${item.toLowerCase()}`}
                        className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors duration-300 uppercase tracking-tighter"
                    >
                        {item}
                    </a>
                ))}
            </div>

            {/* Botón de Acción */}
            <button className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white rounded-full hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Iniciar Sesión
            </button>
        </nav>
    )
}