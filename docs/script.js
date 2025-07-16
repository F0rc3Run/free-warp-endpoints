document.addEventListener('DOMContentLoaded', () => {
    // آدرس فایل results.json شما
    const resultsUrl = 'results.json';
    // !!! URL ی که از Google Apps Script کپی می‌کنید را اینجا قرار دهید !!!
    const logApiUrl = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

    const getBtn = document.getElementById('get-endpoints-btn');
    const resultsContainer = document.getElementById('results-container');
    const statusText = document.getElementById('status-text');

    let isLoading = false;
    let allEndpoints = [];

    // فانکشن برای ارسال لاگ به گوگل شیت
    async function logInteraction() {
        if (!logApiUrl || logApiUrl === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            console.warn("Log API URL not set. Skipping log.");
            return;
        }
        try {
            // یک درخواست ساده ارسال می‌کنیم. گوگل شیت خودش زمان و آی‌پی را ثبت می‌کند.
            await fetch(logApiUrl, { method: 'POST' });
        } catch (error) {
            console.error('Failed to log interaction:', error);
        }
    }

    // فانکشن برای دریافت اولیه لیست اندپوینت‌ها
    async function fetchAllEndpoints() {
        statusText.textContent = 'در حال دریافت لیست سرورها...';
        try {
            const response = await fetch(`${resultsUrl}?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error('فایل نتایج یافت نشد.');
            
            const data = await response.json();
            allEndpoints = [...(data.ipv4 || []), ...(data.ipv6 || [])];
            
            if (allEndpoints.length > 0) {
                statusText.textContent = 'لیست سرورها آماده است. برای دریافت اندپوینت کلیک کنید.';
            } else {
                statusText.textContent = 'لیست سرورها خالی است.';
            }
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
        
        // مرحله اول: ارسال لاگ
        logInteraction();

        isLoading = true;
        const icon = getBtn.querySelector('.icon');
        icon.classList.add('processing');
        resultsContainer.innerHTML = ''; 
        statusText.textContent = 'در حال انتخاب بهترین سرورها...';

        setTimeout(() => {
            // از کل لیست، ۵ مورد را به صورت تصادفی انتخاب می‌کنیم
            const randomEndpoints = [...allEndpoints].sort(() => 0.5 - Math.random()).slice(0, 5);
            displayResults(randomEndpoints);
            
            icon.classList.remove('processing');
            isLoading = false;
        }, 1000); 
    }

    // فانکشن برای نمایش نتایج
    function displayResults(results) {
        if (results.length === 0) {
            statusText.textContent = 'هیچ سروری برای نمایش یافت نشد.';
            return;
        }
        statusText.textContent = 'اندپوینت‌های پیشنهادی برای شما:';
        
        results.forEach((endpoint, index) => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.style.animationDelay = `${index * 100}ms`;
            
            item.innerHTML = `
                <div class="icon-wrapper"><i class="fa-solid fa-server"></i></div>
                <div class="details">
                    <span class="endpoint">${endpoint}</span>
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
        const endpointText = copyBtn.closest('.result-item').querySelector('.endpoint').textContent;
        navigator.clipboard.writeText(endpointText).then(() => {
            const icon = copyBtn.querySelector('i');
            icon.classList.remove('fa-copy'); icon.classList.add('fa-check');
            setTimeout(() => {
                icon.classList.remove('fa-check'); icon.classList.add('fa-copy');
            }, 2000);
        });
    });

    getBtn.addEventListener('click', showRandomEndpoints);
    fetchAllEndpoints(); // در ابتدای بارگذاری صفحه، لیست را دریافت کن
});
