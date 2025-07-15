document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.getElementById("status");
    const tableBody = document.querySelector("#results-table tbody");

    function testLatency(ip, port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const ws = new WebSocket(`wss://${ip}:${port}`);
            ws.onopen = () => {
                ws.close();
                resolve(Date.now() - startTime);
            };
            ws.onerror = () => resolve(null);
            setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
                resolve(null);
            }, 4000); // 4-second timeout
        });
    }

    async function main() {
        try {
            const response = await fetch("results.json");
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }
            const data = await response.json();
            const raw_ipv4_list = data.ipv4 || [];
            const raw_ipv6_list = data.ipv6 || [];
            const all_raw_endpoints = [...raw_ipv4_list, ...raw_ipv6_list];

            const endpoints = all_raw_endpoints.map(entry => {
                const cleanEntry = entry.replace(/[^\x20-\x7E]/g, '');
                const lastColonIndex = cleanEntry.lastIndexOf(':');
                if (lastColonIndex === -1) return null;
                const ip = cleanEntry.substring(0, lastColonIndex);
                const port = cleanEntry.substring(lastColonIndex + 1);
                if (!ip || !port) return null;
                return { ip, port };
            }).filter(Boolean);

            if (endpoints.length === 0) {
                 statusEl.textContent = "No valid endpoints found to test.";
                 return;
            }

            statusEl.textContent = `Testing ${endpoints.length} endpoints...`;
            
            const testPromises = endpoints.map(ep => testLatency(ep.ip, ep.port));
            const latencies = await Promise.all(testPromises);

            const results = [];
            for (let i = 0; i < endpoints.length; i++) {
                if (latencies[i] !== null) {
                    results.push({ ...endpoints[i], latency: latencies[i] });
                }
            }
            results.sort((a, b) => a.latency - b.latency);

            statusEl.textContent = `Found ${results.length} responsive endpoints for you.`;
            displayResults(results);

        } catch (error) {
            statusEl.textContent = "Error processing the results.json file.";
            console.error("Error:", error);
        }
    }

    function displayResults(results) {
        tableBody.innerHTML = "";
        if (results.length === 0) {
            statusEl.textContent = "No responsive endpoints were found.";
            return;
        }
        results.forEach(result => {
            const row = document.createElement("tr");
            const endpoint = `${result.ip}:${result.port}`;
            let latencyClass = "slow";
            if (result.latency < 350) latencyClass = "fast";
            else if (result.latency < 600) latencyClass = "medium";
            
            row.innerHTML = `
                <td>${endpoint}</td>
                <td class="latency ${latencyClass}">${result.latency} ms</td>
                <td><button class="copy-btn">Copy</button></td>
            `;
            row.querySelector(".copy-btn").addEventListener("click", () => {
                navigator.clipboard.writeText(endpoint).then(() => alert(`Copied: ${endpoint}`));
            });
            tableBody.appendChild(row);
        });
    }

    main();
});
