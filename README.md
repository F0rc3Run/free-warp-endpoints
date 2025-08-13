<p align="center">
  <img src="https://raw.githubusercontent.com/F0rc3Run/free-warp-endpoints/refs/heads/main/docs/logo.png" alt="F0rc3Run - Free Internet & WARP WireGuard Generator" width="160"/>
</p>

<h1 align="center">Warp Endpoint Amnezia Scanner</h1>

<p align="center">
  An intelligent, cross-platform Python script to discover the fastest Cloudflare WARP endpoints and generate ready-to-use AmneziaWG profiles to bypass censorship.  
  <br/><br/>
  <b>✊️ Fighting for Free Internet Access</b>  
  <br/><br/>
  <a href="https://t.me/ForceRunVPN"><strong>📢 Telegram Channel</strong></a> •
  <a href="https://www.google.com/search?q=https://github.com/F0rc3Run/F0rc3Run/issues">Report a Bug</a> •
  <a href="https://github.com/F0rc3Run/F0rc3Run">Star the Project</a>
</p>

---

## 📖 Installation & Usage Guide (English)

### Step 1: Install Python & Requirements
Make sure Python 3.7+ is installed. Create a file named `requirements.txt` with:
```
requests
cryptography
ping3
```
Install dependencies:
```bash
pip install -r requirements.txt
```

### Step 2: OS-specific Instructions

<details>
<summary>🖥️ Windows</summary>

- Download and install Python from the official website.  
- **Important:** During installation, check "Add Python to PATH".  
- Run script as Administrator for ping scanning.  
  Open CMD or PowerShell with "Run as administrator".

</details>

<details>
<summary>🐧 Linux</summary>

```bash
sudo apt update && sudo apt install python3 python3-pip -y
```
Run script with sudo:
```bash
sudo python3 FREAS.py
```

</details>

<details>
<summary>📱 Android (Termux)</summary>

```bash
pkg update && pkg upgrade
pkg install python git -y
```
> **Note:** Requires root access for raw socket pings.

</details>

---

## ✨ Key Features

- **🚀 Two-Stage Scanning**  
  - **F0rc3 Scan**: Broad ICMP ping scan across thousands of IPs.  
  - **Run Scan**: Generate Amnezia configs with top-performing endpoints and anti-censorship settings.  

- **🛡️ Censorship Circumvention** – Generates `.zip` AmneziaWG profiles with multiple obfuscations.  
- **💻 Cross-Platform** – Works on Windows, Linux, and Android (Termux).  
- **🤖 Automated** – Includes all IP ranges, creates new WARP account per run.  
- **📊 Detailed Results** – Saves clean `scan_results.txt` with latency data.

---

## 🛠️ How to Use

1. Download `FREAS.py`.  
2. Open terminal with necessary privileges (`Administrator` / `sudo` / root).  
3. Run:
```bash
python FREAS.py
```
4. Follow interactive menu:
   - Disable VPN before scanning.
   - Choose **F0rc3 Scan** or **Custom Scan**.
   - Select IPv4 or IPv6.
   - After initial scan, choose **Run Scan** to generate Amnezia profiles.
5. Import `F0rc3Run_amnezia.zip` into AmneziaVPN and connect.

---

## 🤍 Support Free Internet

- ⭐ Star this repo.  
- 📢 Share with friends and communities.  
- 🧑‍💻 Contribute: report bugs, suggest features, submit PRs.

---

## 📜 License
This project is licensed under the **ForceRun Free Access License (FFAL)**.

📄 [View License Details](https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/LICENSE)

---


<p align="center"><b>Internet should be a right — not a privilege.</b></p>

---

## 🇮🇷 راهنمای نصب و استفاده (فارسی)

<div dir="rtl">

### مرحله ۱: نصب پایتون و پیش‌نیازها
ابتدا مطمئن شوید که **Python 3.7 یا بالاتر** روی سیستم شما نصب است.  
یک فایل با نام `requirements.txt` بسازید و این مقادیر را در آن قرار دهید:
```
requests
cryptography
ping3
```
سپس در ترمینال اجرا کنید:
```bash
pip install -r requirements.txt
```

### مرحله ۲: راهنمای مخصوص هر سیستم‌عامل

<details>
<summary>🖥️ ویندوز</summary>

- پایتون را از سایت رسمی دانلود و نصب کنید.  
- **نکته مهم:** گزینه "Add Python to PATH" را فعال کنید.  
- برای اجرای اسکن پینگ باید اسکریپت را در CMD یا PowerShell که با گزینه "Run as administrator" باز شده اجرا کنید.

</details>

<details>
<summary>🐧 لینوکس</summary>

```bash
sudo apt update && sudo apt install python3 python3-pip -y
```
برای اجرای اسکریپت با دسترسی روت:
```bash
sudo python3 FREAS.py
```

</details>

<details>
<summary>📱 اندروید (ترموکس)</summary>

```bash
pkg update && pkg upgrade
pkg install python git -y
```
> **توجه:** به دلیل نیاز به ساخت سوکت خام برای پینگ، این قابلیت فقط روی دستگاه‌های روت شده کار می‌کند.

</details>

---

### ✨ ویژگی‌ها
- **🚀 اسکن دو مرحله‌ای**  
  - **F0rc3 Scan**
  - شناسایی اندپوینت های پاسخگو (تست پینگ). 

   - **Run Scan**
  - تولید کانفیگ های amnezia با اندپوینت های برتر و تنظیمات ضد سانسور.  

- **🛡️ عبور از فیلترینگ** – تولید پروفایل‌های AmneziaWG با پارامترهای مختلف.  
- **💻 چندسکویی** – پشتیبانی کامل از ویندوز، لینوکس و اندروید.  
- **🤖 خودکار** – شامل تمام IP Rangeها و ایجاد اکانت WARP جدید در هر اجرا.  
- **📊 نتایج دقیق** – ذخیره نتایج در فایل `scan_results.txt`.

---

### 🛠️ نحوه استفاده
1. اسکریپت `FREAS.py` را دانلود کنید.  
2. ترمینال را با دسترسی لازم (ادمین / sudo / روت) باز کنید.  
3. اجرا کنید:
```bash
python FREAS.py
```
4. مراحل را دنبال کنید:
   - قبل از شروع، VPN را خاموش کنید.  
   - بین F0rc3 Scan و Custom Scan انتخاب کنید.  
   - IPv4 یا IPv6 را مشخص کنید.  
   - پس از اسکن اولیه، با Run Scan فایل ZIP را بسازید.  
5. فایل `F0rc3Run_amnezia.zip` را در AmneziaVPN وارد کرده و متصل شوید.

---

### ❤️ حمایت از اینترنت آزاد
- ⭐ ریپو را Star کنید.  
- 📢 لینک ابزار را منتشر کنید.  
- 🧑‍💻 با گزارش باگ یا پیشنهاد قابلیت جدید کمک کنید.

---

📜 **لایسنس:**

📄 [FFAL](https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/LICENSE)
</div>
