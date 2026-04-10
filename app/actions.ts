"use server";

// Proxy seguro ejecutado por el servidor PC de Next.js
export async function getOsrmRouteConfig(lngStart: number, latStart: number, waypointsStr: string, lngEnd: number, latEnd: number) {
    const url = `https://router.project-osrm.org/route/v1/driving/${lngStart},${latStart}${waypointsStr.length > 0 ? ';' + waypointsStr : ''};${lngEnd},${latEnd}?overview=full&geometries=geojson&alternatives=false`;

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
