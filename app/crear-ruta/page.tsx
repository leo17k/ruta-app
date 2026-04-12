"use client";

import { getOsrmRouteConfig, saveRouteToJson } from "@/app/actions";
import { Loader2, Plus, Route as RouteIcon, Save, Trash2, MapPin, MousePointerClick, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import Nav from "../Componets/Nav";
import { Map, MapMarker, MarkerContent, MapRoute } from "@/components/ui/map";
import { useMap } from "@/components/ui/map";
import { useState, useEffect } from "react";

function MapClickHandler({ onMapClick }: { onMapClick: (lng: string, lat: string) => void }) {
    const { map } = useMap();
    useEffect(() => {
        if (!map) return;
        const handler = (e: any) => {
            onMapClick(e.lngLat.lng.toFixed(5), e.lngLat.lat.toFixed(5));
        };
        map.on('click', handler);
        return () => {
            map.off('click', handler);
        };
    }, [map, onMapClick]);
    return null;
}

export default function CrearRutaPage() {
    // states for form
    const [name, setName] = useState("");
    const [startName, setStartName] = useState("");
    const [startLng, setStartLng] = useState("");
    const [startLat, setStartLat] = useState("");

    const [endName, setEndName] = useState("");
    const [endLng, setEndLng] = useState("");
    const [endLat, setEndLat] = useState("");

    const [waypoints, setWaypoints] = useState<{ id: number, name: string, lng: string, lat: string }[]>([]);

    // Map Interaction Mode
    const [clickMode, setClickMode] = useState<"start" | "end" | "waypoint">("start");

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [previewData, setPreviewData] = useState<any>(null);

    const handleMapClick = (lng: string, lat: string) => {
        setPreviewData(null);
        if (clickMode === "start") {
            setStartLng(lng);
            setStartLat(lat);
            setClickMode("end"); // Auto-avanzar al destino
        } else if (clickMode === "end") {
            setEndLng(lng);
            setEndLat(lat);
            setClickMode("waypoint"); // Auto-avanzar a puntos
        } else {
            setWaypoints(prev => [...prev, { id: Date.now(), name: `Parada ${prev.length + 1}`, lng, lat }]);
        }
    };


    const addWaypoint = () => {
        setWaypoints([...waypoints, { id: Date.now(), name: "", lng: "", lat: "" }]);
    };

    const updateWaypoint = (id: number, key: string, value: string) => {
        setPreviewData(null);
        setWaypoints(waypoints.map(wp => wp.id === id ? { ...wp, [key]: value } : wp));
    };

    const removeWaypoint = (id: number) => {
        setPreviewData(null);
        setWaypoints(waypoints.filter(wp => wp.id !== id));
    };

    const handlePreview = async () => {
        if (!startLng || !startLat || !endLng || !endLat) {
            setMessage("Por favor define el Origen y Destino en el mapa primero.");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            const waypointsStr = waypoints
                .filter(wp => wp.lng && wp.lat) // Only valid coords
                .map(wp => `${wp.lng},${wp.lat}`)
                .join(";");

            // Calculate with OSRM
            const osrmData = await getOsrmRouteConfig(
                parseFloat(startLng),
                parseFloat(startLat),
                waypointsStr,
                parseFloat(endLng),
                parseFloat(endLat)
            );

            if (!osrmData || !osrmData.routes || osrmData.routes.length === 0) {
                setMessage("❌ OSRM no pudo calcular esta ruta. Verifica las coordenadas.");
                setPreviewData(null);
                return;
            }

            setPreviewData(osrmData);
            setMessage("👀 Ruta previsualizada. Ajusta posiciones o Nombre, y guarda la ruta.");
        } catch (error) {
            console.error(error);
            setMessage("❌ Error al procesar ruta.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !previewData) {
            setMessage("Por favor asigna un Nombre y asegúrate de Previsualizar la ruta antes de guardarla.");
            return;
        }

        setIsLoading(true);

        try {
            const routeConfig = {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name: name,
                start: { name: startName, lng: parseFloat(startLng), lat: parseFloat(startLat) },
                end: { name: endName, lng: parseFloat(endLng), lat: parseFloat(endLat) },
                waypoints: waypoints
                    .filter(wp => wp.lng && wp.lat)
                    .map((wp, index) => ({
                        id: index + 1,
                        name: wp.name,
                        lng: parseFloat(wp.lng),
                        lat: parseFloat(wp.lat)
                    }))
            };

            const result = await saveRouteToJson(routeConfig, previewData);
            
            if (result.success) {
                setMessage("✅ Ruta guardada exitosamente.");
                // Reset form
                setName("");
                setStartName(""); setStartLng(""); setStartLat("");
                setEndName(""); setEndLng(""); setEndLat("");
                setWaypoints([]);
                setPreviewData(null);
            }
        } catch (error) {
            console.error(error);
            setMessage("❌ Error al guardar la ruta.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative bg-black text-white p-6 pt-24 overflow-auto">
            <Nav />
            {/* Background */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.15), transparent 70%), #000000",
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                        <RouteIcon className="size-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestor de Rutas</h1>
                        <p className="text-white/50 text-sm mt-1">Calcula y guarda nuevas rutas para evitar depender de la API de OSRM constantemente en el cliente.</p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl border ${message.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-8 flex-col lg:flex-row flex gap-8">
                    {/* LEFT SIDE: FORM */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-indigo-300 mb-2 uppercase tracking-wider">Nombre de la Ruta</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Ej. Ruta Centro"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        {/* Interactive Click Mode Selector */}
                        <div className="bg-black/30 p-2 rounded-xl border border-white/5 flex gap-2">
                            <Button
                                variant={clickMode === "start" ? "default" : "ghost"}
                                onClick={() => setClickMode("start")}
                                className={`flex-1 ${clickMode === "start" ? "bg-emerald-600 hover:bg-emerald-500" : "hover:bg-white/5 text-white/50"}`}
                            >
                                <MapPin className="size-4 mr-2" /> 1. Origen
                            </Button>
                            <Button
                                variant={clickMode === "end" ? "default" : "ghost"}
                                onClick={() => setClickMode("end")}
                                className={`flex-1 ${clickMode === "end" ? "bg-rose-600 hover:bg-rose-500" : "hover:bg-white/5 text-white/50"}`}
                            >
                                <MapPin className="size-4 mr-2" /> 2. Destino
                            </Button>
                            <Button
                                variant={clickMode === "waypoint" ? "default" : "ghost"}
                                onClick={() => setClickMode("waypoint")}
                                className={`flex-1 ${clickMode === "waypoint" ? "bg-indigo-600 hover:bg-indigo-500" : "hover:bg-white/5 text-white/50"}`}
                            >
                                <Plus className="size-4 mr-2" /> 3. Paradas
                            </Button>
                        </div>
                        <p className="text-xs text-white/40 text-center animate-pulse"><MousePointerClick className="size-3 inline mr-1" />Haz click en el mapa a la derecha para establecer el punto activo</p>

                        <div className="space-y-4">
                            {/* Start Point */}
                            <div className="bg-black/20 p-5 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <MapPin className="size-5" />
                                        <h3 className="font-bold text-sm">Origen (*)</h3>
                                    </div>
                                    <span className="text-[10px] text-white/30 font-mono">
                                        {startLng && startLat ? `${startLng}, ${startLat}` : 'Vacío'}
                                    </span>
                                </div>
                                <input type="text" placeholder="Nombre lugar (Ej. Terminal)" value={startName} onChange={e => setStartName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 transition-colors" />
                            </div>

                            {/* End Point */}
                            <div className="bg-black/20 p-5 rounded-2xl border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-rose-400">
                                        <MapPin className="size-5" />
                                        <h3 className="font-bold text-sm">Destino (*)</h3>
                                    </div>
                                    <span className="text-[10px] text-white/30 font-mono">
                                        {endLng && endLat ? `${endLng}, ${endLat}` : 'Vacío'}
                                    </span>
                                </div>
                                <input type="text" placeholder="Nombre lugar (Ej. Centro)" value={endName} onChange={e => setEndName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-rose-500 transition-colors outline-none focus:outline-none" />
                            </div>
                        </div>

                        {/* Waypoints */}
                        <div>
                            <div className="flex items-center justify-between mb-3 mt-6">
                                <label className="block text-sm font-semibold text-indigo-300 uppercase tracking-wider">Paradas / Waypoints</label>
                            </div>

                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {waypoints.map((wp, index) => (
                                    <div key={wp.id} className="flex gap-2 bg-black/40 p-3 rounded-xl border border-white/5 items-center relative group">
                                        <span className="w-5 h-5 min-w-[20px] rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center font-bold">{index + 1}</span>
                                        <input type="text" placeholder="Nombre (Opcional)" value={wp.name} onChange={e => updateWaypoint(wp.id, "name", e.target.value)} className="flex-1 bg-transparent text-sm focus:outline-none placeholder-white/20" />
                                        <div className="text-[10px] font-mono text-white/30 hidden sm:block">
                                            {wp.lng}, {wp.lat}
                                        </div>
                                        <button onClick={() => removeWaypoint(wp.id)} className="p-1.5 text-white/30 hover:text-rose-500 bg-white/5 rounded-lg transition-colors">
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {waypoints.length === 0 && (
                                    <div className="text-center py-4 text-white/20 border border-dashed border-white/10 rounded-xl text-sm">
                                        Haz click en el mapa en el modo "Paradas" para agregar puntos intermedios.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 border-t border-white/10 flex gap-4">
                            <Button 
                                onClick={handlePreview} 
                                disabled={isLoading}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-2 py-6 rounded-xl font-bold transition-all text-sm sm:text-base border border-white/10"
                            >
                                {isLoading && !previewData ? (
                                    <Loader2 className="size-5 mr-2 animate-spin" />
                                ) : (
                                    <><RouteIcon className="size-5 mr-2" /> Previsualizar</>
                                )}
                            </Button>
                            
                            <Button 
                                onClick={handleSave} 
                                disabled={isLoading || !previewData || !name}
                                className="flex-[1.5] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-6 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95 text-sm sm:text-base disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoading && previewData ? (
                                    <><Loader2 className="size-5 mr-2 animate-spin" /> Guardando...</>
                                ) : (
                                    <><Save className="size-5 mr-2" /> Guardar Ruta</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT SIDE: MAP */}
                    <div className="flex-1 min-h-[500px] h-auto bg-black/50 border border-white/10 rounded-3xl overflow-hidden relative group">
                        <Map viewport={{ center: [-63.5525, 8.0626], zoom: 12 }}>
                            <MapClickHandler onMapClick={handleMapClick} />

                            {/* Ruta dibujada (Preview) */}
                            {previewData && previewData.routes && previewData.routes.length > 0 && (
                                <MapRoute
                                    coordinates={previewData.routes[0].geometry.coordinates}
                                    color="#6366f1"
                                    width={4}
                                    opacity={0.8}
                                />
                            )}

                            {/* Marker Inicio */}
                            {startLng && startLat && (
                                <MapMarker
                                    longitude={parseFloat(startLng)}
                                    latitude={parseFloat(startLat)}
                                    draggable={true}
                                    onDragEnd={({ lng, lat }) => {
                                        setStartLng(lng.toFixed(5));
                                        setStartLat(lat.toFixed(5));
                                        setPreviewData(null);
                                    }}
                                >
                                    <MarkerContent>
                                        <div className="size-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg shadow-emerald-500/50 cursor-grab active:cursor-grabbing">
                                            <div className="size-1 bg-white rounded-full" />
                                        </div>
                                    </MarkerContent>
                                </MapMarker>
                            )}

                            {/* Marker Fin */}
                            {endLng && endLat && (
                                <MapMarker
                                    longitude={parseFloat(endLng)}
                                    latitude={parseFloat(endLat)}
                                    draggable={true}
                                    onDragEnd={({ lng, lat }) => {
                                        setEndLng(lng.toFixed(5));
                                        setEndLat(lat.toFixed(5));
                                        setPreviewData(null);
                                    }}
                                >
                                    <MarkerContent>
                                        <div className="size-5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-lg shadow-rose-500/50 cursor-grab active:cursor-grabbing">
                                            <div className="size-1 bg-white rounded-full" />
                                        </div>
                                    </MarkerContent>
                                </MapMarker>
                            )}

                            {/* Markers Waypoints */}
                            {waypoints.map((wp, i) => (
                                wp.lng && wp.lat ? (
                                    <MapMarker
                                        key={wp.id}
                                        longitude={parseFloat(wp.lng)}
                                        latitude={parseFloat(wp.lat)}
                                        draggable={true}
                                        onDragEnd={({ lng, lat }) => {
                                            updateWaypoint(wp.id, "lng", lng.toFixed(5));
                                            updateWaypoint(wp.id, "lat", lat.toFixed(5));
                                        }}
                                    >
                                        <MarkerContent>
                                            <div className="size-5 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg shadow-indigo-500/50 text-[10px] font-bold cursor-grab active:cursor-grabbing">
                                                {i + 1}
                                            </div>
                                        </MarkerContent>
                                    </MapMarker>
                                ) : null
                            ))}
                        </Map>

                        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold flex items-center gap-2">
                            <Navigation className="size-3 text-indigo-400" />
                            Modo: <span className={clickMode === 'start' ? 'text-emerald-400' : clickMode === 'end' ? 'text-rose-400' : 'text-indigo-400'}>{clickMode.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
