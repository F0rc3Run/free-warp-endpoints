class ShzAlClient {
    constructor(baseURL = 'https://shz.al') { this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL; }
    async _handleResponse(response) { if (!response.ok) { const errorText = await response.text(); throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`); } return response; }
    async uploadPaste(content, options = {}) {
        const formData = new FormData();
        formData.append('c', content);
        if (options.expiration) formData.append('e', options.expiration);
        const response = await fetch(this.baseURL + '/', { method: 'POST', body: formData });
        await this._handleResponse(response);
        return response.json();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const shzAl = new ShzAlClient();
    const statusText = document.getElementById('statusText');
    const resultsDiv = document.getElementById('results');
    const firstTimeGeneratorDiv = document.getElementById('first-time-generator');
    const configManagerDiv = document.getElementById('config-manager');
    const generateBtn = document.getElementById('generateBtn');
    const generateNewBtn = document.getElementById('generateNewBtn');
    const savedConfigsDropdown = document.getElementById('savedConfigsDropdown');
    const updateEndpointsBtn = document.getElementById('updateEndpointsBtn');
    const renameConfigBtn = document.getElementById('renameConfigBtn');
    const deleteConfigBtn = document.getElementById('deleteConfigBtn');
    const howToUseBtn = document.getElementById('howToUseBtn');
    const howToUseModal = document.getElementById('howToUseModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const howToUseContent = document.getElementById('howToUseContent');
    const loadingButtonHTML = `<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...`;

    let generatedConfigs = null;
    let currentAccount = null;
    let allFetchedEndpoints = [];
    const STORAGE_KEY = 'warpGeneratorAccounts';

    const getSavedAccounts = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const saveAccounts = (accounts) => localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));

    function setStatus(message) { statusText.textContent = message; }
    const generateRandomString = (len) => Array.from({ length: len }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
    const extractKey = (data, keyName) => data.match(new RegExp(`${keyName}:\\s(.+)`))?.[1].trim() || null;

    async function fetchAccountFromWorker() {
    setStatus(`Registering new WARP account...`);
    
    
    const YOUR_NEW_WORKER_URL = 'https://f0rc3run.endpointcache.workers.dev/'; 

    const response = await fetch(YOUR_NEW_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Worker failed:", response.status, errorText);
        throw new Error(`Worker failed: ${response.status}. ${errorText}`);
    }
    
    const accountData = await response.json();

    if (!accountData.config || !accountData.config.interface || !accountData.config.peers) {
        console.error("Unexpected API response:", accountData);
        throw new Error("Received an unexpected response from the worker. Missing config data.");
    }

    return {
        privateKey: accountData.config.interface.private_key,
        v4: accountData.config.interface.addresses.v4,
        v6: accountData.config.interface.addresses.v6,
        peerPublicKey: accountData.config.peers[0].public_key,
        reserved: Array.from(atob(accountData.token)).map(c => c.charCodeAt(0))
    };
    }

    async function fetchAllEndpoints() {
        setStatus("Fetching latest endpoint list...");
        try {
            const response = await fetch('https://raw.githubusercontent.com/F0rc3Run/free-warp-endpoints/refs/heads/main/docs/results.json');
            if (!response.ok) throw new Error('Endpoint list fetch failed');
            const data = await response.json();
            const endpoints = [...(data.ipv4 || []), ...(data.ipv6 || [])];
            const recommended = endpoints.filter(ip => ip.startsWith('8.'));
            const others = endpoints.filter(ip => !ip.startsWith('8.'));
            recommended.sort(() => 0.5 - Math.random());
            others.sort(() => 0.5 - Math.random());
            return recommended.concat(others);
        } catch (error) {
            setStatus("Endpoint fetch failed. Using random fallback.");
            return Array.from({length: 5}, () => "162.159.192." + Math.floor(Math.random() * 256) + ":2408");
        }
    }

    function generateAllFormats(account, allEndpoints, primaryEndpoint) {
const singboxTemplate = {
    "dns": {
        "final": "local-dns",
        "rules": [{
            "action": "route",
            "clash_mode": "Global",
            "server": "proxy-dns",
            "source_ip_cidr": ["172.19.0.0/30", "fdfe:dcba:9876::1/126"]
        }, {
            "action": "route",
            "server": "proxy-dns",
            "source_ip_cidr": ["172.19.0.0/30", "fdfe:dcba:9876::1/126"]
        }, {
            "action": "route",
            "clash_mode": "Direct",
            "server": "direct-dns"
        }, {
            "action": "route",
            "rule_set": ["geosite-ir"],
            "server": "direct-dns"
        }],
        "servers": [{
            "address": "tcp://1.1.1.1",
            "address_resolver": "local-dns",
            "detour": "proxy",
            "tag": "proxy-dns"
        }, {
            "address": "local",
            "detour": "direct",
            "tag": "local-dns"
        }, {
            "address": "tcp://8.8.8.8",
            "detour": "direct",
            "tag": "direct-dns"
        }],
        "strategy": "prefer_ipv4"
    },
    "inbounds": [{
        "address": ["172.19.0.1/30", "fdfe:dcba:9876::1/126"],
        "auto_route": true,
        "endpoint_independent_nat": false,
        "mtu": 9000,
        "platform": {
            "http_proxy": {
                "enabled": true,
                "server": "127.0.0.1",
                "server_port": 2080
            }
        },
        "stack": "system",
        "strict_route": false,
        "type": "tun"
    }, {
        "listen": "127.0.0.1",
        "listen_port": 2080,
        "type": "mixed",
        "users": []
    }],
    "outbounds": [{
        "outbounds": ["auto", "direct"],
        "tag": "proxy",
        "type": "selector"
    }, {
        "interval": "10m",
        "outbounds": [],
        "tag": "auto",
        "tolerance": 50,
        "type": "urltest",
        "url": "http://www.gstatic.com/generate_204"
    }, {
        "tag": "direct",
        "type": "direct"
    }],
    "route": {
        "auto_detect_interface": true,
        "final": "proxy",
        "rule_set": [{
            "tag": "geosite-ads",
            "type": "remote",
            "format": "binary",
            "url": "https://github.com/F0rc3Run/free-warp-endpoints/raw/refs/heads/main/docs/geo/category-ads-all.srs",
            "download_detour": "direct"
        }, {
            "tag": "geosite-ir",
            "type": "remote",
            "format": "binary",
            "url": "https://github.com/F0rc3Run/free-warp-endpoints/raw/refs/heads/main/docs/geo/category-ir.srs",
            "download_detour": "direct"
        }, {
            "tag": "geoip-ad",
            "type": "remote",
            "format": "binary",
            "url": "https://github.com/F0rc3Run/free-warp-endpoints/raw/refs/heads/main/docs/geo/geoip-ad.srs",
            "download_detour": "direct"
        }, {
            "tag": "geoip-ir",
            "type": "remote",
            "format": "binary",
            "url": "https://github.com/F0rc3Run/free-warp-endpoints/raw/refs/heads/main/docs/geo/geoip-ir.srs",
            "download_detour": "direct"
        }, {
            "tag": "geosite-private",
            "type": "remote",
            "format": "binary",
            "url": "https://github.com/F0rc3Run/free-warp-endpoints/raw/refs/heads/main/docs/geo/private.srs",
            "download_detour": "direct"
        }],
        "rules": [{
            "action": "sniff"
        }, {
            "action": "route",
            "clash_mode": "Direct",
            "outbound": "direct"
        }, {
            "action": "route",
            "clash_mode": "Global",
            "outbound": "proxy"
        }, {
            "action": "hijack-dns",
            "protocol": "dns"
        }, {
            "action": "route",
            "outbound": "direct",
            "rule_set": ["geosite-ir", "geoip-ir", "geosite-private"]
        }, {
            "action": "reject",
            "rule_set": ["geosite-ads", "geoip-ad"]
        }]
    }
};
     const urltestOutbound = singboxTemplate.outbounds.find(o => o.tag === 'auto');
        allEndpoints.forEach(ep => {
            const [server, port] = ep.split(':');
            const outboundTag = `WARP-${server}:${port}`;
            const wireguardOutbound = { "type": "wireguard", "tag": outboundTag, "server": server, "server_port": parseInt(port), "local_address": [`${account.v4}/32`, `${account.v6}/128`], "private_key": account.privateKey, "peer_public_key": account.peerPublicKey, "reserved": account.reserved, "mtu": 1280 };
            singboxTemplate.outbounds.push(wireguardOutbound);
            if (urltestOutbound) { urltestOutbound.outbounds.push(outboundTag); }
        });
        return {
            standard: `[Interface]\nPrivateKey = ${account.privateKey}\nAddress = ${account.v4}/32, ${account.v6}/128\nDNS = 1.1.1.1\nMTU = 1280\n\n[Peer]\nPublicKey = ${account.peerPublicKey}\nAllowedIPs = 0.0.0.0/0, ::/0\nEndpoint = ${primaryEndpoint}`,
            amnezia: `[Interface]\nPrivateKey = ${account.privateKey}\nAddress = ${account.v4}/32, ${account.v6}/128\nDNS = 1.1.1.1\nMTU = 1280\nJc = 4\nJmin = 40\nJmax = 70\n\n[Peer]\nPublicKey = ${account.peerPublicKey}\nAllowedIPs = 0.0.0.0/0, ::/0\nEndpoint = ${primaryEndpoint}`,
            singbox: JSON.stringify(singboxTemplate, null, 2)
        };
    }

    function renderResults(configs, allEndpoints, selectedEndpoint) {
        resultsDiv.innerHTML = `
            <div class="bg-gray-800 border border-gray-700 rounded-2xl p-6 md:p-8 mt-8 shadow-2xl">
                <h2 class="text-2xl font-bold mb-6 text-white text-center">Your Configurations are Ready!</h2>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2">
                        <h3 class="text-xl font-bold mb-4 text-center text-gray-300">Configuration Preview & Sharing</h3>
                        <div class="border-b border-gray-700 mb-4">
                            <nav class="flex flex-wrap -mb-px" aria-label="Tabs">
                                <button class="uppercase tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-indigo-500 text-indigo-400" data-tab-target="#tab-standard">Standard WG</button>
                                <button class="uppercase tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-500 mx-4" data-tab-target="#tab-amnezia">AmneziaWG</button>
                                <button class="uppercase tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-500" data-tab-target="#tab-singbox">Sing-Box</button>
                            </nav>
                        </div>
                        <div id="tab-content-area"></div>
                    </div>
                    <div class="flex flex-col items-center justify-center pt-6 lg:pt-0">
                        <h3 id="qrcode-title" class="font-semibold text-lg mb-2 text-indigo-400"></h3>
                        <div id="qrcode-wrapper" class="p-4 bg-white rounded-lg shadow-md">
                            <div id="qrcode"></div>
                            <p id="qrcode-message" class="hidden text-center text-gray-700 p-8 font-medium">This format is not suitable for QR code scanning.</p>
                        </div>
                    </div>
                </div>
            </div>`;
        
        populateTabs(configs, allEndpoints, selectedEndpoint);
        updateQrCode(configs.standard, 'QR Code (Standard WG)');
        
        if (resultsDiv.classList.contains('hidden')) {
            resultsDiv.classList.remove('hidden');
            setTimeout(() => { resultsDiv.style.opacity = 1; resultsDiv.style.transform = 'translateY(0)'; }, 10);
        }
    }
    
    function populateTabs(configs, allEndpoints, selectedEndpoint) {
        const tabContentArea = document.getElementById('tab-content-area');
        const templates = [
            { id: "standard", title: "Standard WireGuard Format", content: configs.standard, color: "blue", showSelector: true },
            { id: "amnezia", title: "AmneziaWG Format (Jitter)", content: configs.amnezia, color: "purple", showSelector: true },
            { id: "singbox", title: "sing-box Format (URL-Test)", content: configs.singbox, color: "indigo", showSelector: false }
        ];
        let html = '';
        templates.forEach(data => {
            const endpointSelectorHtml = data.showSelector ? createEndpointSelectorHTML(allEndpoints, selectedEndpoint, `endpoint-selector-${data.id}`) : '';
            html += `<div id="tab-${data.id}" class="tab-pane ${data.id !== 'standard' ? 'hidden' : ''}">
                <h3 class="font-semibold text-lg mb-2 text-indigo-400">${data.title}</h3>
                ${createActionButtons(data.content, data.color, data.id)}
                <pre class="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm break-all max-h-[300px]"><code>${escapeHtml(data.content)}</code></pre>
                ${endpointSelectorHtml}
                ${createDownloadLinks(data.id)}
            </div>`;
        });
        tabContentArea.innerHTML = html;
    }

    async function startNewGeneration(button) {
        const originalText = button.innerHTML;
        button.disabled = true; button.innerHTML = loadingButtonHTML;
        try {
            const newAccount = await fetchAccountFromWorker();
            let name = prompt("Enter a name for this new configuration:", `Config ${new Date().toLocaleString()}`);
            if (!name) name = `Config ${new Date().toLocaleString()}`;
            
            const accounts = getSavedAccounts();
            accounts.push({ name, account: newAccount });
            saveAccounts(accounts);
            
            setStatus("New config saved! Loading...");
            await initialize(); 
            savedConfigsDropdown.selectedIndex = accounts.length - 1;
            await loadSelectedConfig(false);
        } catch (error) {
            console.error("New generation process failed:", error);
            setStatus("An error occurred. Please try again.");
        } finally {
            button.disabled = false; button.innerHTML = originalText;
            setTimeout(() => setStatus(""), 3000);
        }
    }

    async function loadSelectedConfig(showStatus = true) {
        const selectedIndex = savedConfigsDropdown.selectedIndex;
        const accounts = getSavedAccounts();
        if (selectedIndex < 0 || selectedIndex >= accounts.length) {
            resultsDiv.classList.add('hidden');
            return;
        }

        if (showStatus) setStatus("Loading selected config with latest endpoints...");
        currentAccount = accounts[selectedIndex].account;
        allFetchedEndpoints = await fetchAllEndpoints();
        const primaryEndpoint = allFetchedEndpoints.length > 0 ? allFetchedEndpoints[0] : "162.159.192.1:2408";
        generatedConfigs = generateAllFormats(currentAccount, allFetchedEndpoints, primaryEndpoint);
        renderResults(generatedConfigs, allFetchedEndpoints, primaryEndpoint);
        if (showStatus) setTimeout(() => setStatus(""), 3000);
    }

    function showManagerUI(accounts) {
        firstTimeGeneratorDiv.classList.add('hidden');
        configManagerDiv.classList.remove('hidden');
        savedConfigsDropdown.innerHTML = '';
        accounts.forEach((acc, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = acc.name;
            savedConfigsDropdown.appendChild(option);
        });
    }

    async function initialize() {
        const accounts = getSavedAccounts();
        if (accounts.length > 0) {
            showManagerUI(accounts);
            await loadSelectedConfig(false);
        } else {
            firstTimeGeneratorDiv.classList.remove('hidden');
            configManagerDiv.classList.add('hidden');
            resultsDiv.classList.add('hidden');
        }
    }
    
    generateBtn.addEventListener('click', e => startNewGeneration(e.currentTarget));
    generateNewBtn.addEventListener('click', e => startNewGeneration(e.currentTarget));

    savedConfigsDropdown.addEventListener('change', () => loadSelectedConfig());
    updateEndpointsBtn.addEventListener('click', () => loadSelectedConfig());

    deleteConfigBtn.addEventListener('click', () => {
        const selectedIndex = savedConfigsDropdown.selectedIndex;
        const accounts = getSavedAccounts();
        if (selectedIndex < 0) return;
        
        if (confirm(`Are you sure you want to delete "${accounts[selectedIndex].name}"? This cannot be undone.`)) {
            accounts.splice(selectedIndex, 1);
            saveAccounts(accounts);
            setStatus("Configuration deleted.");
            initialize();
        }
    });
    
    renameConfigBtn.addEventListener('click', () => {
        const selectedIndex = savedConfigsDropdown.selectedIndex;
        const accounts = getSavedAccounts();
        if (selectedIndex < 0) return;

        const oldName = accounts[selectedIndex].name;
        const newName = prompt("Enter a new name for this configuration:", oldName);
        if (newName && newName !== oldName) {
            accounts[selectedIndex].name = newName;
            saveAccounts(accounts);
            setStatus("Configuration renamed.");
            savedConfigsDropdown.options[selectedIndex].textContent = newName;
        }
    });
    
    function escapeHtml(text) { const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return text.replace(/[&<>"']/g, m => map[m]); }
    
    function createDownloadLinks(clientType) {
        const links = {
            standard: [{ name: 'Windows', url: 'https://download.wireguard.com/windows-client/wireguard-installer.exe' }, { name: 'Android', url: 'https://play.google.com/store/apps/details?id=com.wireguard.android' }, { name: 'iOS', url: 'https://apps.apple.com/us/app/wireguard/id1441195209' }, { name: 'Linux', url: 'https://www.wireguard.com/install/' },],
            amnezia: [{ name: 'Windows', url: 'https://github.com/amnezia-vpn/amneziawg-windows-client/releases/latest' }, { name: 'Android', url: 'https://play.google.com/store/apps/details?id=org.amnezia.awg&hl=en' }, { name: 'iOS', url: 'https://apps.apple.com/us/app/amneziawg/id6478942365' }, { name: 'Linux', url: 'https://github.com/amnezia-vpn/amneziawg-linux-kernel-module' },],
            singbox: [{ name: 'Windows (Hiddify)', url: 'https://github.com/hiddify/hiddify-app/releases/latest' }, { name: 'Android', url: 'https://github.com/SagerNet/sing-box-for-android/releases/latest' }, { name: 'iOS', url: 'https://apps.apple.com/us/app/sing-box-vt/id6673731168' }, { name: 'Linux (Core)', url: 'https://github.com/SagerNet/sing-box/releases/latest' },]
        };
        const clientLinks = links[clientType];
        if (!clientLinks) return '';
        let linksHtml = '<div class="mt-6 pt-4 border-t border-gray-700">';
        linksHtml += '<h4 class="text-sm font-semibold text-gray-400 mb-3 text-center">Download a Compatible Client:</h4>';
        linksHtml += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">';
        clientLinks.forEach(link => { linksHtml += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="block bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors">${link.name}</a>`; });
        linksHtml += '</div></div>';
        return linksHtml;
    }

    function createEndpointSelectorHTML(endpoints, selectedEndpoint, groupName) {
        let html = `<div class="mt-6 pt-4 border-t border-gray-700"><h4 class="text-base font-semibold text-gray-300 mb-3 text-center">Select an Endpoint</h4><p class="text-sm text-center text-gray-400 mb-4"><span class="font-bold text-indigo-400">Recommended:</span> Endpoints starting with <code class="bg-gray-700 text-indigo-300 px-1 rounded">8.x.x.x</code> may offer better performance on some ISPs.</p><div class="max-h-[200px] overflow-y-auto bg-gray-900 p-3 rounded-lg border border-gray-700 space-y-2">`;
        endpoints.forEach(ep => {
            const isChecked = ep === selectedEndpoint ? 'checked' : '';
            const isRecommended = ep.startsWith('8.');
            const labelClass = isRecommended ? 'text-indigo-300' : 'text-gray-300';
            const recommendText = isRecommended ? `<span class="text-xs font-sans font-bold text-indigo-500 ml-2">(Recommended)</span>` : '';
            html += `<label class="flex items-center p-2 rounded-md hover:bg-gray-700/50 transition-colors cursor-pointer"><input type="radio" name="${groupName}" value="${ep}" class="h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-indigo-500 focus:ring-offset-gray-800" ${isChecked}><span class="ml-3 ${labelClass} font-mono text-sm">${ep} ${recommendText}</span></label>`;
        });
        html += `</div></div>`;
        return html;
    }

    function createActionButtons(content, color, id) {
        const hasDownload = id === 'standard' || id === 'amnezia';
        const filename = id === 'standard' ? 'wg-config.conf' : 'amnezia-config.conf';
        let buttonsHtml = `<div class="flex space-x-2 mb-2"><button class="copy-btn flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg" data-clipboard-text="${escape(content)}">Copy</button>`;
        if (hasDownload) { buttonsHtml += `<button class="download-btn flex-1 bg-${color}-600 hover:bg-${color}-700 text-white font-semibold py-2 px-4 rounded-lg" data-download-content="${escape(content)}" data-filename="${filename}">Download .conf</button>`; }
        buttonsHtml += `<button class="share-btn flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg" data-share-content="${escape(content)}">Share Link</button></div><div class="share-result-container hidden mt-2"><input type="text" readonly class="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-gray-300"><button class="copy-link-btn w-full mt-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg text-sm">Copy Link</button></div>`;
        return buttonsHtml;
    }
    
    function updateQrCode(content, title) {
        const qrcodeContainer = document.getElementById('qrcode'), qrcodeTitle = document.getElementById('qrcode-title'), qrcodeMessage = document.getElementById('qrcode-message');
        qrcodeTitle.textContent = title;
        if (content) {
            qrcodeContainer.innerHTML = '';
            new QRCode(qrcodeContainer, { text: content, width: 200, height: 200, correctLevel : QRCode.CorrectLevel.L });
            qrcodeContainer.classList.remove('hidden');
            qrcodeMessage.classList.add('hidden');
        } else {
            qrcodeContainer.innerHTML = '';
            qrcodeContainer.classList.add('hidden');
            qrcodeMessage.classList.remove('hidden');
        }
    }
    
    function updateStandardConfigs(newEndpoint) {
        if (!currentAccount || !allFetchedEndpoints.length) return;
        generatedConfigs = generateAllFormats(currentAccount, allFetchedEndpoints, newEndpoint);
        populateTabs(generatedConfigs, allFetchedEndpoints, newEndpoint);
        const activeTab = document.querySelector('.tab-btn.border-indigo-500');
        if (activeTab) {
            const activeTabId = activeTab.dataset.tabTarget;
            if (activeTabId === '#tab-standard') { updateQrCode(generatedConfigs.standard, 'QR Code (Standard WG)'); }
            else if (activeTabId === '#tab-amnezia') { updateQrCode(generatedConfigs.amnezia, 'QR Code (AmneziaWG)'); }
        }
    }
    
    resultsDiv.addEventListener('click', async e => {
        const target = e.target;
        const button = target.closest('button');
        if (button) {
            if (button.classList.contains('copy-btn')) { const textToCopy = unescape(button.dataset.clipboardText); const originalText = button.innerHTML; navigator.clipboard.writeText(textToCopy).then(() => { button.innerHTML = 'Copied!'; setTimeout(() => { button.innerHTML = originalText; }, 2000); }); return; }
            if (button.classList.contains('download-btn')) { const content = unescape(button.dataset.downloadContent); const filename = button.dataset.filename; const blob = new Blob([content], { type: 'application/octet-stream' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); document.body.removeChild(a); return; }
            if (button.classList.contains('share-btn')) { const contentToShare = unescape(button.dataset.shareContent); const originalText = button.innerHTML; button.disabled = true; button.innerHTML = 'Sharing...'; try { const result = await shzAl.uploadPaste(contentToShare, { expiration: '1h' }); const shareUrl = result.url; const container = button.closest('.tab-pane').querySelector('.share-result-container'); container.querySelector('input').value = shareUrl; container.classList.remove('hidden'); const parentPane = button.closest('.tab-pane'); if (parentPane && parentPane.id === 'tab-singbox') { updateQrCode(shareUrl, 'sing-box Share Link QR'); } } catch (error) { console.error("Share failed:", error); alert("Failed to share config."); } finally { button.disabled = false; button.innerHTML = originalText; } return; }
            if (button.classList.contains('copy-link-btn')) { const linkToCopy = button.previousElementSibling.value; const originalText = button.innerHTML; navigator.clipboard.writeText(linkToCopy).then(() => { button.innerHTML = 'Link Copied!'; setTimeout(() => { button.innerHTML = originalText; }, 2000); }); return; }
        }
        if (target.classList.contains('tab-btn')) {
            const activeTabClasses = ['border-indigo-500', 'text-indigo-400'], inactiveTabClasses = ['border-transparent', 'text-gray-400', 'hover:text-gray-300', 'hover:border-gray-500'];
            document.querySelectorAll('.tab-btn').forEach(btn => { btn.classList.remove(...activeTabClasses); btn.classList.add(...inactiveTabClasses); });
            target.classList.add(...activeTabClasses); target.classList.remove(...inactiveTabClasses);
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
            document.querySelector(target.dataset.tabTarget).classList.remove('hidden');
            if (!generatedConfigs) return;
            switch (target.dataset.tabTarget) {
                case '#tab-standard': updateQrCode(generatedConfigs.standard, 'QR Code (Standard WG)'); break;
                case '#tab-amnezia': updateQrCode(generatedConfigs.amnezia, 'QR Code (AmneziaWG)'); break;
                case '#tab-singbox': { const singboxShareInput = document.querySelector('#tab-singbox .share-result-container input'); if (singboxShareInput && singboxShareInput.value) { updateQrCode(singboxShareInput.value, 'sing-box Share Link QR'); } else { updateQrCode(null, 'QR Code (Not Scannable)'); } break; }
                default: updateQrCode(null, 'QR Code (Not Scannable)'); break;
            }
        }
    });
    
    resultsDiv.addEventListener('change', e => {
        if (e.target.matches('input[name^="endpoint-selector-"]')) {
            const newEndpoint = e.target.value;
            updateStandardConfigs(newEndpoint);
        }
    });

    howToUseBtn.addEventListener('click', () => { 
        // NOTE: You should change this URL to point to your own English README file.
        fetch('https://raw.githubusercontent.com/F0rc3Run/free-warp-endpoints/refs/heads/main/README.md')
            .then(response => { if (!response.ok) { throw new Error('README.md not found.'); } return response.text(); })
            .then(markdown => { howToUseContent.innerHTML = marked.parse(markdown); howToUseModal.classList.remove('hidden'); })
            .catch(error => { console.error('Error fetching readme:', error); howToUseContent.innerHTML = `<p class="text-red-400">Error: Could not load the help file.</p>`; howToUseModal.classList.remove('hidden'); }); 
    });
    const closeModal = () => howToUseModal.classList.add('hidden');
    closeModalBtn.addEventListener('click', closeModal);
    howToUseModal.addEventListener('click', (e) => { if (e.target === howToUseModal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && !howToUseModal.classList.contains('hidden')) closeModal(); });
    
    initialize();
});
