// script.js

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-scan-btn');
    const outputContainer = document.getElementById('output-container');
    const outputTitle = document.getElementById('output-title');
    const scanResultsDiv = document.getElementById('scan-results');
    const statusText = document.getElementById('status-text');

    let isScanning = false;

    // فانکشن تست پینگ از طریق WebSocket
    function testLatency(ip, port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const ws = new WebSocket(`wss://${ip}:${port}`);
            ws.onopen = () => {
                ws.close();
                resolve({ ip, port, latency: Date.now() - startTime });
            };
            ws.onerror = () => resolve(null);
            setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) ws.close();
                resolve(null);
            }, 3000); // تایم‌اوت ۳ ثانیه‌ای
        });
    }

    async function startScan() {
        if (isScanning) return;
        isScanning = true;

        const icon = startBtn.querySelector('.icon');
        icon.classList.add('processing');
        outputContainer.style.display = 'none';
        scanResultsDiv.innerHTML = '';
        statusText.textContent = 'در حال دریافت لیست کاندیداها...';

        try {
            const response = await fetch(`results.json?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error('لیست کاندیداها یافت نشد.');
            
            const data = await response.json();
            const all_raw_endpoints = [...(data.ipv4 || []), ...(data.ipv6 || [])];
            
            const endpoints = all_raw_endpoints.map(entry => {
                const cleanEntry = entry.replace(/[^\x20-\x7E]/g, '');
                const lastColonIndex = cleanEntry.lastIndexOf(':');
                if (lastColonIndex === -1) return null;
                return { ip: cleanEntry.substring(0, lastColonIndex), port: cleanEntry.substring(lastColonIndex + 1) };
            }).filter(Boolean);

            if (endpoints.length === 0) throw new Error('لیست کاندیداها خالی است.');

            statusText.textContent = `شروع اسکن زنده روی ${endpoints.length} سرور...`;

            // اجرای همزمان تمام تست‌ها
            const promises = endpoints.map(ep => testLatency(ep.ip, ep.port));
            const allResults = await Promise.all(promises);

            // فیلتر کردن نتایج موفق
            const successfulResults = allResults.filter(r => r !== null);
            
            // مرتب‌سازی بر اساس پینگ واقعی کاربر
            successfulResults.sort((a, b) => a.latency - b.latency);

            displayResults(successfulResults);

        } catch (error) {
            statusText.textContent = `خطا: ${error.message}`;
        } finally {
            isScanning = false;
            icon.classList.remove('processing');
        }
    }

    function displayResults(results) {
        outputContainer.style.display = 'block';
        scanResultsDiv.innerHTML = ''; // پاک کردن نتایج قبلی

        if (results.length === 0) {
            outputTitle.textContent = 'نتیجه اسکن';
            statusText.textContent = 'متاسفانه هیچ سرور فعالی برای اینترنت شما پیدا نشد.';
            return;
        }

        const topResults = results.slice(0, 3); // نمایش ۳ نتیجه برتر
        outputTitle.textContent = `یافت شد! ${results.length} سرور فعال (نمایش ۳ مورد برتر)`;
        statusText.textContent = 'این نتایج بر اساس سرعت اینترنت شما مرتب شده‌اند.';
        
        topResults.forEach(result => {
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
