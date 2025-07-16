document.addEventListener('DOMContentLoaded', () => {
    // آدرس فایل نتایج شما
    const resultsUrl = 'results.json';

    // شناسه‌های صحیح برای دسترسی به عناصر صفحه
    const startBtn = document.getElementById('scan-btn');
    const resultsContainer = document.getElementById('results-container');
    const statusText = document.getElementById('status-text');

    let isLoading = false;
    let allEndpoints = [];

    // فانکشن برای دریافت و ذخیره اولیه لیست اندپوینت‌ها
    async function fetchAllEndpoints() {
        statusText.textContent = 'در حال دریافت لیست سرورهای تست‌شده...';
        try {
            const response = await fetch(`${resultsUrl}?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error('فایل نتایج یافت نشد.');
            allEndpoints = await response.json();
            statusText.textContent = 'لیست سرورها آماده است. برای دریافت اندپوینت کلیک کنید.';
        } catch (error) {
            statusText.textContent = `خطا: ${error.message}`;
        }
    }

    // فانکشن اصلی برای انتخاب و نمایش نتایج
    function showRandomEndpoints() {
        if (isLoading || allEndpoints.length === 0) {
            if (allEndpoints.length === 0) fetchAllEndpoints();
            return;
        }
        
        isLoading = true;
        const icon = startBtn.querySelector('.icon');
        icon.classList.add('processing');
        resultsContainer.innerHTML = ''; 
        statusText.textContent = 'در حال انتخاب سرورهای تصادفی...';

        setTimeout(() => {
            const latencyThreshold = 300;
            let goodEndpoints = allEndpoints.filter(ep => ep.latency < latencyThreshold);
            if (goodEndpoints.length < 5) {
                goodEndpoints = [...allEndpoints];
            }
            const randomEndpoints = [...goodEndpoints].sort(() => 0.5 - Math.random()).slice(0, 5);

            displayResults(randomEndpoints);
            
            icon.classList.remove('processing');
            isLoading = false;
        }, 1000); 
    }

    // فانکشن برای نمایش جذاب نتایج
    function displayResults(results) {
        if (results.length === 0) {
            statusText.textContent = 'هیچ سروری برای نمایش یافت نشد.';
            return;
        }
        statusText.textContent = '۵ اندپوینت پرسرعت (انتخاب تصادفی):';
        
        results.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.style.animationDelay = `${index * 100}ms`;
            
            item.innerHTML = `
                <div class="icon-wrapper"><i class="fa-solid fa-server"></i></div>
                <div class="details">
                    <span class="endpoint">${result.endpoint}</span>
                    <span class="latency">Ping (via Server): ${result.latency} ms</span>
                </div>
                <button class="copy-btn" title="کپی کردن اندپوینت"><i class="fa-solid fa-copy"></i></button>
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

    startBtn.addEventListener('click', showRandomEndpoints);
    fetchAllEndpoints();
});
