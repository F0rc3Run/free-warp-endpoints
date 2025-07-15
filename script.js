document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.getElementById("status");
    const tableBody = document.querySelector("#results-table tbody");

    function testLatency(ip, port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const ws = new WebSocket(`wss://${ip}:${port}`);
            
            ws.onopen = () => {
                const latency = Date.now() - startTime;
                ws.close();
                resolve(latency);
            };

            ws.onerror = () => {
                resolve(null);
            };
            
            setTimeout(() => {
                resolve(null);
                ws.close();
            }, 2000);
        });
    }
    
    async function main() {
        try {
            // *** تغییر اصلی اینجاست ***
            // استفاده از آدرس کامل و مستقیم برای جلوگیری از خطا
            const response = await fetch("https://raw.githubusercontent.com/F0rc3Run/free-warp-endpoints/main/results.json");
            
            // بررسی اینکه آیا دانلود موفقیت‌آمیز بوده است
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const endpoints = await response.json();
            statusEl.textContent = `در حال تست ${endpoints.length} اندپوینت...`;

            const testPromises = endpoints.map(ep => testLatency(ep.ip, ep.port));
            const latencies = await Promise.all(testPromises);

            const results = [];
            for (let i = 0; i < endpoints.length; i++) {
                if (latencies[i] !== null) {
                    results.push({ ...endpoints[i], latency: latencies[i] });
                }
            }

            results.sort((a, b) => a.latency - b.latency);

            statusEl.textContent = `تعداد ${results.length} اندپوینت پاسخگو برای شما یافت شد.`;
            displayResults(results);

        } catch (error) {
            statusEl.textContent = "خطا در بارگذاری یا تست اندپوینت‌ها.";
            console.error("Fetch Error:", error);
        }
    }

    function displayResults(results) {
        tableBody.innerHTML = "";
        results.forEach(result => {
            const row = document.createElement("tr");
            const endpoint = `${result.ip}:${result.port}`;

            let latencyClass = "slow";
            if (result.latency < 250) latencyClass = "fast";
            else if (result.latency < 500) latencyClass = "medium";
            
            row.innerHTML = `
                <td>${endpoint}</td>
                <td class="latency ${latencyClass}">${result.latency} ms</td>
                <td><button class="copy-btn">کپی</button></td>
            `;

            row.querySelector(".copy-btn").addEventListener("click", () => {
                navigator.clipboard.writeText(endpoint).then(() => {
                    alert(`کپی شد: ${endpoint}`);
                });
            });

            tableBody.appendChild(row);
        });
    }

    main();
});
