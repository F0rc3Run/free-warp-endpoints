<p align="center">
  <img src="https://raw.githubusercontent.com/F0rc3Run/free-warp-endpoints/refs/heads/main/docs/logo.png" alt="F0rc3Run - Free Internet & WARP WireGuard Generator" width="160"/>
</p>

<h1 align="center">Warp Endpoint Wireguard Scanner</h1>

A powerful and intelligent tool designed to scan, test, and discover the **best-performing Cloudflare WARP endpoints**. It automatically generates a **WireGuard configuration file** optimized for a fast and stable connection.

![EndpointWireGuardScanner Screenshot](assets/screenshot.png)

---

## 🚀 About The Project

Cloudflare WARP is an excellent service for a fast and secure internet connection. However, not all WARP servers (endpoints) offer the same level of performance. Manually finding a server with the **lowest latency (ping)** and **highest download speed** is a difficult and time-consuming task.

This tool automates the entire process. It scans thousands of Cloudflare IPs, benchmarks each one against key performance metrics, and presents a sorted list of the best available servers. Finally, it generates a ready-to-use WireGuard configuration file for you.

---

## ✨ Key Features

-   **🤖 Automated Scanning:** Intelligently scans thousands of IPs from Cloudflare's CIDR ranges.
-   **⚡ Accurate Speed Testing:** Measures the real-world download speed of each endpoint.
-   **⏱️ Latency (Ping) Testing:** Finds endpoints with the lowest ping for a more responsive experience in browsing and gaming.
-   **🌐 Reachability Scoring:** Checks endpoint quality by testing access to popular websites.
-   **📄 Automatic Config Generation:** Creates a `F0rc3Run.conf` file with the best-found endpoint, ready to be imported into WireGuard.
-   **⚙️ Flexible Configuration:** All testing parameters, including worker count, ports, and test sites, are fully customizable via a `config.yaml` file.

---

## ⚙️ How to Use

Follow these steps to get started:

### **1. Download **
Grab the latest version for your operating system from the **[Releases](https://github.com/F0rc3Run/free-warp-endpoints/releases)** page.

### **2. Create Required Files**
Place the following two files in the same directory as the executable:

-   **`config.yaml`:** The main configuration file. Create it by copying the `config.example.yaml` file from this repository.
-   **`sources_ipv4.txt`:** A text file containing a list of Cloudflare IP ranges to scan. Each CIDR range should be on a new line.

### **3. Run **
Execute the program and choose your desired test from the menu:
1.  **IPv4 (Speed Test Only):** A quick scan based only on download speed.
2.  **IPv4 (Speed + Latency Test):** A complete scan that measures both speed and ping (Recommended).
3.  **Custom:** Manually enter endpoints to test.

After the test is complete, the results will be displayed and saved to `result.txt`. You can then choose to generate your WireGuard configuration file.

---

## 🔧 Configuration (`config.yaml`)

To configure the scanner, copy the `config.example.yaml` from this repository to a new file named `config.yaml`. This file allows you to control all aspects of the test.

Key settings include:
-   `worker_count`: The number of concurrent threads for scanning.
-   `sources_ipv4`: The path to your IP list file.
-   `timeout_seconds`: The timeout for each network test.
-   `download_url`: The URL for speed testing.
-   `test_sites`: Websites to check for reachability scores.
-   `ports`: A list of ports to test on each IP.
-   `ping_host`: The target for the latency (ping) test.

---

## 🤝 Contributing
If you find a bug or have a suggestion for a new feature, please open an **[Issue](https://github.com/F0rc3Run/free-warp-endpoints/issues)**. Contributions are welcome!

---

## 🤍 Support Free Internet

- ⭐ Star this repo.  
- 📢 Share with friends and communities.  
- 🧑‍💻 Contribute: report bugs, suggest features, submit PRs.

---

## 📜 License
This project is licensed under the **ForceRun Free Access License (FFAL)**.

📄 [View License Details](https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/LICENSE)
