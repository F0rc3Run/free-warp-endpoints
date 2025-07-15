document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.getElementById("status");
    const tableBody = document.querySelector("#results-table tbody");

    function testLatency(ip, port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            // فرمت URL برای IPv6 باید به صورت wss://[...]:port باشد که این کد به درستی آن را مدیریت می‌کند
            const ws = new WebSocket(`wss://${ip}:${port}`);
            
            ws.onopen = () => {
                ws.close();
                resolve(Date.now() - startTime);
            };
            ws.onerror = () => resolve(null);
            // تایم‌اوت ۲ ثانیه‌ای برای هر اتصال
            setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
                resolve(null);
            }, 5000);
        });
    }

    async function main() {
        try {
            const response = await fetch("results.json");
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }
            const data = await response.json();

            // --- شروع تغییرات اصلی برای پشتیبانی از IPv6 ---
            
            // ۱. هر دو لیست ipv4 و ipv6 را از فایل جیسون استخراج می‌کنیم
            const raw_ipv4_list = data.ipv4 || [];
            const raw_ipv6_list = data.ipv6 || [];

            // ۲. دو لیست را با هم ادغام می‌کنیم تا یک لیست کامل داشته باشیم
            const all_raw_endpoints = [...raw_ipv4_list, ...raw_ipv6_list];

            // ۳. لیست رشته‌ها را به فرمت مورد نیاز کد (آرایه‌ای از آبجکت‌ها) تبدیل می‌کنیم
            // این منطق جدید به درستی هر دو فرمت IPv4 و IPv6 را پردازش می‌کند
            const endpoints = all_raw_endpoints.map(entry => {
                const cleanEntry = entry.replace(/[^\x20-\x7E]/g, '');
                
                // آخرین کالن (:) جداکننده IP از پورت است. این روش برای هر دو فرمت کار می‌کند.
                const lastColonIndex = cleanEntry.lastIndexOf(':');
                if (lastColonIndex === -1) return null;

                const ip = cleanEntry.substring(0, lastColonIndex);
                const port = cleanEntry.substring(lastColonIndex + 1);

                if (!ip || !port) return null;
                return { ip, port };
            }).filter(Boolean);

            // --- پایان تغییرات اصلی ---

            if (endpoints.length === 0) {
                 statusEl.textContent = "هیچ اندپوینت معتبری برای تست پیدا نشد.";
                 return;
            }

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
            statusEl.textContent = "خطا در پردازش فایل results.json.";
            console.error("Error:", error);
        }
    }

    function displayResults(results) {
        tableBody.innerHTML = "";
        if (results.length === 0) {
            statusEl.textContent = "هیچ اندپوینت پاسخگویی یافت نشد.";
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
                <td><button class="copy-btn">کپی</button></td>
            `;
            row.querySelector(".copy-btn").addEventListener("click", () => {
                navigator.clipboard.writeText(endpoint).then(() => alert(`کپی شد: ${endpoint}`));
            });
            tableBody.appendChild(row);
        });
    }

    main();
});
