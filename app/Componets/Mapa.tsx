"use client";

import { useEffect, useState } from "react";
import {
    Map,
    MapMarker,
    MarkerContent,
    MapRoute,
    MarkerLabel,
    type MapViewport
} from "@/components/ui/map";
import { Loader2, Clock, Route as RouteIcon, Waypoints, Navigation, Bus, LocateFixed, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getOsrmRouteConfig } from "@/app/actions";
import rutasDataRaw from "@/app/Rutas.json";

const rutasData = rutasDataRaw as any[];

// --- CONFIGURACIÓN DE RUTAS ---
// Aquí puedes agregar todas las rutas que necesites.
const BASE_ROUTES = [
    {
        id: "pepsi",
        name: "Pepsi",
        start: { name: "Final de la España", lng: -63.55250, lat: 8.06260 },
        end: { name: "Paseo Orinoco", lng: -63.54450, lat: 8.14586 },
        waypoints: [
            { id: 1, name: "Aceiticos", lng: -63.56280, lat: 8.11600 },
            { id: 2, name: "", lng: -63.56182, lat: 8.11690 },
            { id: 3, name: "Fabrica Coca-Cola", lng: -63.55516, lat: 8.12720 },
            { id: 4, name: "HospiFarma", lng: -63.55423, lat: 8.12984 },
            { id: 5, name: "Seguro Social", lng: -63.54985, lat: 8.13009 },
            { id: 6, name: "Periferico", lng: -63.55203, lat: 8.13471 },
            { id: 7, name: "", lng: -63.55374, lat: 8.13805 },
            { id: 8, name: "", lng: -63.557771, lat: 8.13912 }
        ]
    },
    {
        id: "2",
        name: "Marhuanta",
        start: { name: "Peaje", lng: -63.45296, lat: 8.09513 },
        end: { name: "Paseo Orinoco", lng: -63.54450, lat: 8.14586 },
        waypoints: [

        ]
    },
    {
        id: "3",
        name: "Proceres",
        start: { name: "Av Prerimetral", lng: -63.59870, lat: 8.09512 },
        end: { name: "Paseo Orinoco", lng: -63.54450, lat: 8.14586 },
        waypoints: [
            { id: 1, name: "HospiFarma", lng: -63.55423, lat: 8.12984 },
            { id: 2, name: "Seguro Social", lng: -63.54985, lat: 8.13009 },
            { id: 3, name: "Periferico", lng: -63.55203, lat: 8.13471 },
            { id: 4, name: "", lng: -63.55374, lat: 8.13805 },
            { id: 5, name: "", lng: -63.557771, lat: 8.13912 }
        ]
    }
];

// Combinamos las hardcodeadas con las guardadas en el JSON
const AVAILABLE_ROUTES = [
    ...BASE_ROUTES,
    ...rutasData
        .filter(r => r.config && !BASE_ROUTES.some(br => br.id === r.config.id || br.name === r.nombre))
        .map(r => r.config)
];

interface RouteData {
    coordinates: [number, number][];
    duration: number;
    distance: number;
}

const formatDuration = (s: number) => {
    const m = Math.round(s / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

const formatDistance = (m: number) =>
    m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

export default function MyMap() {
    const [activeRouteId, setActiveRouteId] = useState(AVAILABLE_ROUTES[0].id);
    const activeRouteConfig = AVAILABLE_ROUTES.find(r => r.id === activeRouteId) || AVAILABLE_ROUTES[0];
    const [isRoutesOpen, setIsRoutesOpen] = useState(false);

    // Ahora guardamos la ruta de OSRM directamente (como un solo objeto)
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Estado para el bus simulado
    const [busPosition, setBusPosition] = useState<[number, number] | null>(null);

    // Estado para la ubicación del usuario
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    const [viewport, setViewport] = useState<MapViewport>({
        center: [activeRouteConfig.start.lng, activeRouteConfig.start.lat],
        zoom: 13,
        bearing: 0,
        pitch: 0,
    });

    // Centrar el mapa al cambiar de ruta
    useEffect(() => {
        setViewport(prev => ({
            ...prev,
            center: [activeRouteConfig.start.lng, activeRouteConfig.start.lat]
        }));
    }, [activeRouteId]);

    // Calcular trazado de la ruta seleccionada
    useEffect(() => {
        let isMounted = true;

        async function fetchRouteData() {
            setIsLoading(true);
            try {
                const rutaGuardada = rutasData.find(r => r.nombre === activeRouteConfig.name);

                if (rutaGuardada && rutaGuardada.routes && rutaGuardada.routes.length > 0) {
                    const osrmRoute = rutaGuardada.routes[0];
                    setRouteData({
                        coordinates: osrmRoute.geometry.coordinates,
                        duration: osrmRoute.duration,
                        distance: osrmRoute.distance,
                    });
                    if (isMounted) setIsLoading(false);
                    return;
                }

                const waypointsStr = activeRouteConfig.waypoints
                    .map((p: any) => `${p.lng},${p.lat}`)
                    .join(";");

                // El celular o PC ya no le habla directo a OSRM.
                // Le delega la tarea al servidor de Next.js de tu computadora, el cual NUNCA será bloqueado por CORS.
                const data = await getOsrmRouteConfig(
                    activeRouteConfig.start.lng,
                    activeRouteConfig.start.lat,
                    waypointsStr,
                    activeRouteConfig.end.lng,
                    activeRouteConfig.end.lat
                );

                if (!isMounted) return;

                if (data && data.routes && data.routes.length > 0) {
                    const osrmRoute = data.routes[0];
                    setRouteData({
                        coordinates: osrmRoute.geometry.coordinates,
                        duration: osrmRoute.duration,
                        distance: osrmRoute.distance,
                    });
                } else {
                    setRouteData(null);
                }
            } catch (error) {
                console.error("Error al trazar ruta:", error);
                if (isMounted) setRouteData(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchRouteData();

        return () => {
            isMounted = false;
        };
    }, [activeRouteId]);

    // Simular el movimiento del bus
    useEffect(() => {
        if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
            setBusPosition(null);
            return;
        }

        let currentIndex = 0;
        setBusPosition(routeData.coordinates[currentIndex]);

        // Computamos la velocidad (milisegundos por punto) basada en los puntos que tiene la ruta
        const speed = Math.max(50, Math.min(200, 15000 / routeData.coordinates.length));

        const moveBus = setInterval(() => {
            currentIndex++;
            // Si el bus llega al final, volvemos a empezar su recorrido
            if (currentIndex >= routeData.coordinates.length) {
                currentIndex = 0;
            }
            setBusPosition(routeData.coordinates[currentIndex]);
        }, speed);

        return () => clearInterval(moveBus);
    }, [routeData]);

    const handleLocateMe = () => {
        setIsLocating(true);

        const fallbackToMockLocation = () => {
            // Ya que las IPs en Venezuela las enrutan por otros estados (ej. Barinas, Caracas)
            // usamos una ubicación simulada directa en Ciudad Bolívar para poder probar la interfaz.
            const lng = -63.5510;
            const lat = 8.1300;

            console.warn("Usando ubicación simulada en Ciudad Bolívar (GPS bloqueado por PC)");
            setUserLocation([lng, lat]);
            setViewport(prev => ({
                ...prev,
                center: [lng, lat],
                zoom: 14
            }));
            setIsLocating(false);
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { longitude, latitude } = position.coords;
                    setUserLocation([longitude, latitude]);
                    setViewport(prev => ({
                        ...prev,
                        center: [longitude, latitude],
                        zoom: 15
                    }));
                    setIsLocating(false);
                },
                (error) => {
                    console.warn(`GPS falló o dio timeout (${error.message}). Usando simulación de Ciudad Bolívar...`);
                    fallbackToMockLocation();
                },
                {
                    enableHighAccuracy: false,
                    timeout: 4000,
                    maximumAge: 0
                }
            );
        } else {
            fallbackToMockLocation();
        }
    };

    return (
        <div className="h-screen w-full relative bg-[#0a0a0a] overflow-hidden">
            <Map viewport={viewport} onViewportChange={setViewport}>
                {/* Dibujar la línea de la ruta */}
                {routeData && (
                    <MapRoute
                        coordinates={routeData.coordinates}
                        color="#6366f1"
                        width={6}
                        opacity={1}
                    />
                )}

                {/* Marcadores de Control Dinámicos */}
                {activeRouteConfig.waypoints.map((point: any) => {
                    return (
                        <MapMarker key={point.id} longitude={point.lng} latitude={point.lat}>
                            <MarkerContent>
                                <div className="size-2.5 rounded-full bg-white/20 border border-white/40 backdrop-blur-sm" />
                            </MarkerContent>
                        </MapMarker>
                    );
                })}

                {/* Inicio y Fin Dinámicos */}
                <MapMarker longitude={activeRouteConfig.start.lng} latitude={activeRouteConfig.start.lat}>
                    <MarkerContent>
                        <div className="size-4 rounded-full bg-emerald-500 border-2 border-white" />
                    </MarkerContent>
                </MapMarker>

                <MapMarker longitude={activeRouteConfig.end.lng} latitude={activeRouteConfig.end.lat}>
                    <MarkerContent>
                        <div className="size-4 rounded-full bg-rose-500 border-2 border-white" />
                    </MarkerContent>
                </MapMarker>

                {/* Marcador de Bus Simulado
                {busPosition && (
                    <MapMarker longitude={busPosition[0]} latitude={busPosition[1]}>
                        <MarkerContent>
                            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_15px_rgba(251,191,36,0.6)] z-50">
                                <Bus className="w-4 h-4 text-amber-950" />
                            </div>
                        </MarkerContent>
                    </MapMarker>
                )} */}

                {/* Marcador de Usuario (Mi Ubicación) */}
                {userLocation && (
                    <MapMarker longitude={userLocation[0]} latitude={userLocation[1]}>
                        <MarkerContent>
                            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.6)] z-[60]">
                                <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75"></div>
                                <div className="size-2 bg-white rounded-full"></div>
                            </div>
                        </MarkerContent>
                    </MapMarker>
                )}
            </Map>

            {/* BOTÓN PARA MI UBICACIÓN */}
            <div className="absolute bottom-10 right-6 z-30 max-sm:bottom-20">
                <Button
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    variant="outline"
                    className="size-14 max-sm:size-10 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-indigo-400/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/30"
                >
                    {isLocating ? (
                        <Loader2 className="size-6 max-sm:size-4 text-white animate-spin" />
                    ) : (
                        <LocateFixed className="size-6 max-sm:size-4 text-white" />
                    )}
                </Button>
            </div>

            {/* PANEL DE INFORMACIÓN DE COORDENADAS (HUD) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-6 bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl">
                <div className="flex flex-col">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Longitud</span>
                    <span className="text-white font-mono text-sm">{viewport.center[0].toFixed(5)}</span>
                </div>
                <div className="w-[1px] bg-white/10 h-8 self-center" />
                <div className="flex flex-col">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Latitud</span>
                    <span className="text-white font-mono text-sm">{viewport.center[1].toFixed(5)}</span>
                </div>
                <div className="w-[1px] bg-white/10 h-8 self-center" />
                <div className="flex flex-col">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Zoom</span>
                    <span className="text-white font-mono text-sm">{viewport.zoom.toFixed(1)}</span>
                </div>
            </div>

            {/* LISTA DE RUTAS (Botones Flotantes) */}
            <div className="absolute top-24 left-6 z-30 flex flex-col gap-3 w-64">
                <button
                    onClick={() => setIsRoutesOpen(!isRoutesOpen)}
                    className="flex items-center justify-between w-full bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl hover:bg-white/10 transition-all shadow-lg group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                            <Navigation className="size-4 text-indigo-400" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Ruta Actual</span>
                            <span className="text-sm font-bold text-white tracking-wide">{activeRouteConfig.name}</span>
                        </div>
                    </div>
                    {isRoutesOpen ? (
                        <ChevronUp className="size-5 text-indigo-400" />
                    ) : (
                        <ChevronDown className="size-5 text-white/50" />
                    )}
                </button>

                <div className={`flex flex-col gap-3 transition-all duration-500 overflow-hidden ${isRoutesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                    {AVAILABLE_ROUTES.map((configRoute) => {
                        const isActive = configRoute.id === activeRouteId;
                        return (
                            <Button
                                key={configRoute.id}
                                variant={isActive ? "default" : "outline"}
                                onClick={() => {
                                    setActiveRouteId(configRoute.id);
                                    setIsRoutesOpen(false);
                                }}
                                className={`group justify-start gap-4 h-max px-4 py-3 rounded-xl transition-all duration-300 w-full ${isActive
                                    ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20"
                                    : "bg-black/40 border-white/10 backdrop-blur-md hover:bg-white/10"
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${isActive ? "bg-white/20" : "bg-white/5"}`}>
                                    <Waypoints className={`size-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                                </div>
                                <div className="flex gap-4 items-center flex-1">
                                    <span className={`text-[16px] uppercase font-bold ${isActive ? "text-indigo-50" : "text-gray-300"}`}>
                                        {configRoute.name}
                                    </span>

                                    {/* Mostrar la data sólo si es la ruta activa y los datos cargaron */}
                                    {isActive && routeData && (
                                        <div className="flex flex-col justify-end items-end flex-1 ">
                                            <span className="text-sm font-bold text-indigo-100">
                                                {formatDuration(routeData.duration)}
                                            </span>
                                            <span className="text-[10px] opacity-60 flex items-center gap-1 text-indigo-200">
                                                <RouteIcon className="size-2.5" /> {formatDistance(routeData.distance)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* LOADER */}
            {isLoading && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="size-10 animate-spin text-indigo-500" />
                        <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest animate-pulse">
                            Calculando Trayectorias...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}