document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.getElementById("status");
    const tableBody = document.querySelector("#results-table tbody");

    /**
     * ۱. این تابع پینگ هر IP را از مرورگر کاربر تست می‌کند
     */
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
                resolve(null); // در صورت خطا، پینگ نامعتبر است
            };
            
            // اگر بعد از ۲ ثانیه پاسخی نیامد، اتصال را ناموفق در نظر بگیر
            setTimeout(() => {
                resolve(null);
                ws.close();
            }, 2000);
        });
    }
    
    async function main() {
        try {
            // دریافت لیست اولیه از فایل جیسون
            const response = await fetch("results.json");
            const endpoints = await response.json();
            statusEl.textContent = `Testing ${endpoints.length} endpoints...`;

            // تست پینگ تمام اندپوینت‌ها به صورت همزمان
            const testPromises = endpoints.map(ep => testLatency(ep.ip, ep.port));
            const latencies = await Promise.all(testPromises);

            const results = [];
            for (let i = 0; i < endpoints.length; i++) {
                if (latencies[i] !== null) {
                    results.push({ ...endpoints[i], latency: latencies[i] });
                }
            }

            /**
             * ۲. این خط کد، نتایج را بر اساس پینگ مرتب می‌کند
             */
            results.sort((a, b) => a.latency - b.latency);

            statusEl.textContent = `Found ${results.length} responsive endpoints for you.`;
            
            /**
             * ۳. اینجا نتایج مرتب‌شده در جدول نمایش داده می‌شود
             */
            displayResults(results);

        } catch (error) {
            statusEl.textContent = "Error loading or testing endpoints.";
            console.error(error);
        }
    }

    function displayResults(results) {
        tableBody.innerHTML = ""; // پاک کردن جدول قبل از نمایش نتایج جدید
        results.forEach(result => {
            const row = document.createElement("tr");
            const endpoint = `${result.ip}:${result.port}`;

            let latencyClass = "slow";
            if (result.latency < 250) latencyClass = "fast";
            else if (result.latency < 500) latencyClass = "medium";
            
            row.innerHTML = `
                <td>${endpoint}</td>
                <td class="latency ${latencyClass}">${result.latency} ms</td>
                <td><button class="copy-btn">Copy</button></td>
            `;

            // افزودن قابلیت کپی کردن با کلیک روی دکمه
            row.querySelector(".copy-btn").addEventListener("click", () => {
                navigator.clipboard.writeText(endpoint).then(() => {
                    alert(`Copied: ${endpoint}`);
                });
            });

            tableBody.appendChild(row);
        });
    }

    main();
});
