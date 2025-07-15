document.addEventListener('DOMContentLoaded', () => {
    // آدرس لیست اندپوینت‌ها برای تست
    const endpointListUrl = 'https://raw.githubusercontent.com/vfarid/cf-ip-scanner/main/results.json';

    const startBtn = document.getElementById('start-scan-btn');
    const outputContainer = document.getElementById('output-container');
    const outputTitle = document.getElementById('output-title');
    const scanResultsDiv = document.getElementById('scan-results');
    const statusText = document.getElementById('status-text');

    let isScanning = false;

    // فانکشن تست پینگ
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
                if (ws.readyState === WebSocket.CONNECTING) ws.close();
                resolve(null);
            }, 3000); // تایم‌اوت ۳ ثانیه‌ای
        });
    }

    // فانکشن اصلی اسکن
    async function startScan() {
        if (isScanning) return;
        isScanning = true;

        const icon = startBtn.querySelector('.icon');
        icon.classList.add('processing');
        outputContainer.style.display = 'none';
        scanResultsDiv.innerHTML = '';
        statusText.textContent = 'در حال دریافت لیست سرورها...';

        try {
            const response = await fetch(endpointListUrl);
            if (!response.ok) throw new Error('Network error while fetching list');
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
                return { ip, port };
            }).filter(Boolean);

            if (endpoints.length === 0) throw new Error('Endpoint list is empty or invalid.');

            statusText.textContent = `تعداد ${endpoints.length} سرور یافت شد. شروع تست پینگ...`;

            const testPromises = endpoints.map(ep => testLatency(ep.ip, ep.port));
            const latencies = await Promise.all(testPromises);

            const results = [];
            for (let i = 0; i < endpoints.length; i++) {
                if (latencies[i] !== null) {
                    results.push({ ...endpoints[i], latency: latencies[i] });
                }
            }

            results.sort((a, b) => a.latency - b.latency);
            const top3Results = results.slice(0, 3);

            displayResults(top3Results);

        } catch (error) {
            statusText.textContent = `خطا: ${error.message}`;
        } finally {
            isScanning = false;
            icon.classList.remove('processing');
        }
    }

    // فانکشن نمایش نتایج
    function displayResults(results) {
        outputContainer.style.display = 'block';
        if (results.length === 0) {
            outputTitle.textContent = 'نتیجه اسکن';
            statusText.textContent = 'متاسفانه هیچ سرور فعالی برای اینترنت شما پیدا نشد.';
            return;
        }

        outputTitle.textContent = '۳ سرور برتر برای شما';
        statusText.textContent = 'اسکن کامل شد.';
        
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <span class="endpoint">${result.ip}:${result.port}</span>
                <span class="latency">${result.latency} ms</span>
            `;
            scanResultsDiv.appendChild(item);
        });
    }

    startBtn.addEventListener('click', startScan);
});
