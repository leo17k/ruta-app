"use server";

// Proxy seguro ejecutado por el servidor PC de Next.js
export async function getOsrmRouteConfig(lngStart: number, latStart: number, waypointsStr: string, lngEnd: number, latEnd: number) {
    const url = `https://router.project-osrm.org/route/v1/driving/${lngStart},${latStart}${waypointsStr.length > 0 ? ';' + waypointsStr : ''};${lngEnd},${latEnd}?overview=full&geometries=geojson&alternatives=false`;
    console.log(url)
    try {

        const response = await fetch(url, { cache: "no-store", keepalive: true });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("OSRM Server Action Fetch Error:", error);
        return null;
    }
}

import fs from 'fs';
import path from 'path';

export async function saveRouteToJson(routeConfig: any, osrmData: any) {
    const filePath = path.join(process.cwd(), 'app', 'Rutas.json');
    let rutas: any[] = [];
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        try {
            rutas = JSON.parse(fileContent);
        } catch (e) { }
    }

    // Evitar duplicados por nombre
    const existingIndex = rutas.findIndex((r: any) => r.nombre === routeConfig.name);

    const newRoute = {
        id: existingIndex >= 0 ? rutas[existingIndex].id : (rutas.length > 0 ? Math.max(...rutas.map((r: any) => r.id || 0)) + 1 : 1),
        nombre: routeConfig.name,
        config: routeConfig, // Guardamos la config (start, end, waypoints) para reconstruir
        code: osrmData.code || "Ok",
        routes: osrmData.routes,
        osrmWaypoints: osrmData.waypoints // Estos son los del OSRM
    };

    if (existingIndex >= 0) {
        rutas[existingIndex] = newRoute;
    } else {
        rutas.push(newRoute);
    }

    fs.writeFileSync(filePath, JSON.stringify(rutas, null, 4));
    return { success: true, message: "Ruta guardada exitosamente en Rutas.json" };
}
