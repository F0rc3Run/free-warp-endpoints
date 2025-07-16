document.addEventListener('DOMContentLoaded', () => {
    // آدرس فایل محلی در ریپازیتوری شما
    const resultsUrl = 'results.json';

    // دسترسی به عناصر صفحه با شناسه‌های صحیح از HTML شما
    const startBtn = document.getElementById('scan-btn');
    const resultsContainer = document.getElementById('results-container');
    const statusText = document.getElementById('status-text');

    let isScanning = false;
    let allEndpoints = []; // برای ذخیره لیست کاندیداها

    // فانکشن تست پینگ زنده از مرورگر کاربر
    function testLatency(ip, port) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const ws = new WebSocket(`wss://${ip}:${port}`);
            ws.onopen = () => {
                ws.close();
                // در صورت موفقیت، آبجکتی شامل اندپوینت و پینگ را برمی‌گرداند
                resolve({ endpoint: `${ip}:${port}`, latency: Date.now() - startTime });
            };
            ws.onerror = () => resolve(null); // در صورت خطا، null برمی‌گرداند
            setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) ws.close();
                resolve(null);
            }, 3000); // تایم‌اوت ۳ ثانیه‌ای
        });
    }

    // فانکشن اصلی برای شروع اسکن
    async function startScan() {
        if (isScanning) return;
        isScanning = true;

        const icon = startBtn.querySelector('.icon');
        icon.classList.add('processing');
        resultsContainer.innerHTML = '';
        statusText.textContent = 'در حال دریافت لیست سرورها...';

        try {
            const response = await fetch(`${resultsUrl}?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error('فایل results.json یافت نشد.');
            
            const data = await response.json();
            // لیست‌های ipv4 و ipv6 را از جیسون خوانده و با هم ادغام می‌کنیم
            const all_raw_endpoints = [...(data.ipv4 || []), ...(data.ipv6 || [])];

            if (all_raw_endpoints.length === 0) throw new Error('لیست کاندیداها خالی است.');

            statusText.textContent = `شروع اسکن زنده روی ${all_raw_endpoints.length} سرور...`;

            // اجرای همزمان تمام تست‌ها
            const promises = all_raw_endpoints.map(ep => {
                const lastColonIndex = ep.lastIndexOf(':');
                const ip = ep.substring(0, lastColonIndex);
                const port = ep.substring(lastColonIndex + 1);
                return testLatency(ip, port);
            });

            const allResults = await Promise.all(promises);

            // فیلتر کردن نتایج موفق (آنهایی که null نیستند)
            const successfulResults = allResults.filter(r => r !== null);
            
            // مرتب‌سازی بر اساس پینگ واقعی کاربر
            successfulResults.sort((a, b) => a.latency - b.latency);

            displayRandomTopEndpoints(successfulResults);

        } catch (error) {
            statusText.textContent = `خطا: ${error.message}`;
        } finally {
            isScanning = false;
            icon.classList.remove('processing');
        }
    }

    // فانکشن برای نمایش ۵ نتیجه تصادفی از بین بهترین‌ها
    function displayRandomTopEndpoints(results) {
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            statusText.textContent = 'متاسفانه هیچ سرور فعالی برای اینترنت شما پیدا نشد.';
            return;
        }

        // بهترین‌ها را جدا می‌کنیم (مثلاً ۲۰ سرور برتر)
        const topTierEndpoints = results.slice(0, 20);
        // از بین بهترین‌ها، ۵ مورد را به صورت تصادفی انتخاب می‌کنیم
        const randomTop5 = topTierEndpoints.sort(() => 0.5 - Math.random()).slice(0, 5);
        
        statusText.textContent = '۵ اندپوینت پرسرعت برای شما (بر اساس تست زنده):';
        
        randomTop5.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'result-item'; // این کلاس در style.css شما وجود دارد
            item.style.animationDelay = `${index * 100}ms`;
            
            item.innerHTML = `
                <span class="endpoint">${result.endpoint}</span>
                <div class="result-details">
                    <span class="latency">${result.latency} ms</span>
                    <button class="copy-btn" title="کپی کردن اندپوینت"><i class="fa-solid fa-copy"></i></button>
                </div>
            `;
            resultsContainer.appendChild(item);
        });
    }

    // مدیریت کپی کردن
    resultsContainer.addEventListener('click', (event) => {
        const copyBtn = event.target.closest('.copy-btn');
        if (!copyBtn) return;

        const resultItem = copyBtn.closest('.result-item');
        const endpointText = resultItem.querySelector('.endpoint').textContent;
        
        navigator.clipboard.writeText(endpointText).then(() => {
            const icon = copyBtn.querySelector('i');
            icon.classList.remove('fa-copy');
            icon.classList.add('fa-check');
            setTimeout(() => {
                icon.classList.remove('fa-check');
                icon.classList.add('fa-copy');
            }, 2000);
        });
    });

    startBtn.addEventListener('click', startScan);
});
