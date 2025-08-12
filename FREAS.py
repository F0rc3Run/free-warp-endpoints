import os
import sys
import json
import base64
import ipaddress
import random
import time
import threading
import zipfile
from datetime import datetime

# --- Dependency Check ---
try:
    import requests
    from ping3 import ping
    from cryptography.hazmat.primitives.asymmetric import x25519
except ImportError:
    print("Error: Required libraries not found.")
    print("Please create a 'requirements.txt' file with the following content:")
    print("requests\ncryptography\nping3")
    print("\nThen run this command in your terminal:")
    print("pip install -r requirements.txt")
    sys.exit(1)

# --- Embedded Data ---
# Data from ips-v4.txt is now inside the script
IPV4_RANGES = [
    "162.159.192.0/24", "162.159.193.0/24", "162.159.195.0/24",
    "162.159.204.0/24", "188.114.96.0/24", "188.114.97.0/24",
    "188.114.98.0/24", "188.114.99.0/24"
]

# Data from ips-v6.txt is now inside the script
IPV6_RANGES = ["2606:4700:d0::/48", "2606:4700:d1::/48"]

# Data from amnezia-settings.txt is now inside the script
AMNEZIA_PROFILES = [
    # User Requested Profiles
    {"jc": 3, "jmin": 100, "jmax": 1000}, {"jc": 3, "jmin": 80, "jmax": 1200},
    {"jc": 3, "jmin": 100, "jmax": 900}, {"jc": 2, "jmin": 200, "jmax": 600},
    {"jc": 4, "jmin": 40, "jmax": 70},
    # Aggressive Profiles (For Heavy Censorship)
    {"jc": 3, "jmin": 20, "jmax": 200}, {"jc": 2, "jmin": 10, "jmax": 300},
    {"jc": 5, "jmin": 15, "jmax": 150},
    # Balanced Profiles
    {"jc": 4, "jmin": 50, "jmax": 150}, {"jc": 3, "jmin": 60, "jmax": 250},
    # High Performance Profiles (For Light Censorship)
    {"jc": 5, "jmin": 80, "jmax": 250}, {"jc": 8, "jmin": 100, "jmax": 300}
]

# --- Configuration ---
RESULT_FILENAME = "scan_results.txt"
ZIP_FILENAME = "F0rc3Run_amnezia.zip"
CONFIG_PORTS = [2408, 1701, 500, 4500, 8886, 908, 891, 890, 928, 1010, 859, 934, 943, 946, 988, 7152]
MAX_IPS_PER_RANGE = 25
MAX_THREADS_PING = 200

# --- Core Functions ---

def generate_wireguard_keys():
    private_key_obj = x25519.X25519PrivateKey.generate()
    public_key_obj = private_key_obj.public_key()
    private_key_b64 = base64.b64encode(private_key_obj.private_bytes_raw()).decode('utf-8')
    public_key_b64 = base64.b64encode(public_key_obj.public_bytes_raw()).decode('utf-8')
    return private_key_b64, public_key_b64

def register_warp_account(public_key):
    headers = {'Content-Type': 'application/json; charset=UTF-8', 'User-Agent': 'okhttp/4.9.2'}
    payload = {
        "key": public_key, "install_id": "", "fcm_token": "",
        "tos": datetime.utcnow().isoformat()[:-3] + "Z", "type": "Android", "locale": "en_US"
    }
    try:
        response = requests.post('https://www.warp-generator.workers.dev/wg', headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"\n--> Network error while registering WARP account: {e}")
        return None

def build_amnezia_config(account_data, private_key, endpoint, amnezia_settings):
    return (
        f"[Interface]\n"
        f"PrivateKey = {private_key}\n"
        f"Address = {account_data['config']['interface']['addresses']['v4']}/32,{account_data['config']['interface']['addresses']['v6']}/128\n"
        f"DNS = 1.1.1.1\n"
        f"MTU = 1280\n"
        f"Jc = {amnezia_settings['jc']}\n"
        f"Jmin = {amnezia_settings['jmin']}\n"
        f"Jmax = {amnezia_settings['jmax']}\n"
        f"\n[Peer]\n"
        f"PublicKey = {account_data['config']['peers'][0]['public_key']}\n"
        f"AllowedIPs = 0.0.0.0/0, ::/0\n"
        f"Endpoint = {endpoint}\n"
    )

def generate_endpoints_from_ranges(ip_ranges):
    endpoints = set()
    print("--> Generating a smart list of IPs from ranges...")
    for cidr in ip_ranges:
        try:
            net = ipaddress.ip_network(cidr)
            if net.num_addresses > 1:
                hosts = list(net.hosts())
                sample_size = min(len(hosts), MAX_IPS_PER_RANGE)
                ip_sample = random.sample(hosts, sample_size)
                for ip in ip_sample:
                    for port in CONFIG_PORTS:
                        endpoints.add(f"{ip}:{port}" if net.version == 4 else f"[{ip}]:{port}")
            else:
                for port in CONFIG_PORTS:
                    endpoints.add(f"{net.network_address}:{port}" if net.version == 4 else f"[{net.network_address}]:{port}")
        except ValueError:
            print(f"Warning: Invalid CIDR range '{cidr}' skipped.")
    
    final_endpoints = list(endpoints)
    random.shuffle(final_endpoints)
    print(f"--> Generated {len(final_endpoints)} unique endpoints for scanning.")
    return final_endpoints

# --- Scanner Functions ---

def f0rc3_scan_worker(endpoint, results, lock, progress_counter, total):
    ip = endpoint.split(':')[0].strip('[]')
    try:
        latency = ping(ip, timeout=2, unit='ms')
        if latency is not False and latency is not None:
            with lock:
                results.append({'endpoint': endpoint, 'latency': latency})
    except Exception:
        pass
    with lock:
        progress_counter['value'] += 1
        print(f"\r--> Pinging... {progress_counter['value']}/{total} ({int(progress_counter['value']/total*100)}%)", end="", flush=True)

def perform_ping_scan(endpoints):
    results = []
    lock = threading.Lock()
    threads = []
    progress_counter = {'value': 0}
    total = len(endpoints)
    
    print(f"\n--- Starting F0rc3 Scan (Ping) on {total} endpoints ---")
    
    for endpoint in endpoints:
        thread = threading.Thread(target=f0rc3_scan_worker, args=(endpoint, results, lock, progress_counter, total))
        threads.append(thread)
        thread.start()
        
        if len(threads) >= MAX_THREADS_PING:
            for t in threads:
                t.join()
            threads = []

    for t in threads:
        t.join()

    print(f"\n--> F0rc3 Scan complete. Sorting results...")
    return sorted(results, key=lambda x: x['latency'])

# --- UI and Main Logic ---

def print_welcome_banner():
    """Prints the welcome message and program information."""
    os.system('cls' if os.name == 'nt' else 'clear')
    print("##############################################################")
    print("#                                                            #")
    print("#           F0rc3Run Endpoint Amnezia Scanner                #")
    print("#                                                            #")
    print("##############################################################")
    print("\nWelcome to the ultimate tool for finding the best WARP endpoints")
    print("and generating ready-to-use AmneziaWG configuration files.")
    print("\n--------------------------------------------------------------")
    print("Please support this project by giving a star on GitHub:")
    print("https://github.com/F0rc3Run/F0rc3Run")
    print("--------------------------------------------------------------")
    print("\nIMPORTANT: For the best and most accurate results,")
    print("please make sure your current VPN is turned OFF before starting.")
    print("--------------------------------------------------------------\n")
    input("Press Enter to continue...")

def get_user_choice(prompt, options):
    """Gets a valid user choice from a list of options."""
    while True:
        try:
            choice = int(input(prompt))
            if choice in options:
                return choice
            else:
                print("Invalid option, please try again.")
        except ValueError:
            print("Please enter a number.")

def get_custom_endpoints():
    """Gets a list of custom endpoints from the user."""
    print("\nEnter between 1 and 30 custom endpoints (e.g., 1.1.1.1:2408).")
    print("Enter a blank line when you are finished.")
    endpoints = []
    while len(endpoints) < 30:
        line = input(f"Endpoint {len(endpoints)+1}: ").strip()
        if not line:
            if endpoints: break
            else: print("Please enter at least one endpoint.")
        else:
            endpoints.append(line)
    return endpoints

def create_amnezia_zip(account_data, private_key, top_endpoints):
    """Creates a zip file with Amnezia configs for the top endpoints."""
    print(f"\n--> Creating '{ZIP_FILENAME}' with Amnezia profiles...")
    
    with zipfile.ZipFile(ZIP_FILENAME, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for i, endpoint in enumerate(top_endpoints):
            for profile in AMNEZIA_PROFILES:
                config_str = build_amnezia_config(account_data, private_key, endpoint, profile)
                # Create a unique name for each config file inside the zip
                ip_sanitized = endpoint.replace(":", "_").strip("[]")
                config_name = f"Amnezia_{ip_sanitized}_Jc{profile['jc']}.conf"
                zipf.writestr(config_name, config_str)
    
    print(f"--> Successfully created '{ZIP_FILENAME}' with multiple configurations.")
    print("--> You can now import this zip file directly into your Amnezia client.")

def main():
    """Main script execution."""
    print_welcome_banner()

    print("\n[Step 1/3] Generating base WireGuard account...")
    private_key, public_key = generate_wireguard_keys()
    account_data = register_warp_account(public_key)
    if not account_data:
        input("\nCould not create a WARP account. Press Enter to exit.")
        return
    print("--> Base account created successfully.")

    print("\n[Step 2/3] Choose a scan source:")
    print("  1. F0rc3 Scan (Fast Ping Scan on Recommended Ranges)")
    print("  2. Custom Scan (Your own list of endpoints)")
    scan_source = get_user_choice("Enter your choice (1-2): ", [1, 2])

    scan_results = []

    if scan_source == 1:
        print("\nChoose IP version to scan:")
        print("  1. IPv4")
        print("  2. IPv6")
        ip_choice = get_user_choice("Enter your choice (1-2): ", [1, 2])
        ip_type = "ipv4" if ip_choice == 1 else "ipv6"
        ip_ranges = IPV4_RANGES if ip_type == "ipv4" else IPV6_RANGES
        endpoints_to_scan = generate_endpoints_from_ranges(ip_ranges)
        scan_results = perform_ping_scan(endpoints_to_scan)
    
    else: # Custom Scan
        endpoints_to_scan = get_custom_endpoints()
        if not endpoints_to_scan:
            print("No custom endpoints entered. Exiting.")
            return
        scan_results = perform_ping_scan(endpoints_to_scan)

    if not scan_results:
        print("\nScan did not find any working endpoints. Exiting.")
        input("Press Enter to exit.")
        return

    with open(RESULT_FILENAME, "w", encoding="utf-8") as f:
        f.write(f"# F0rc3 Scan (Ping) Results - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        for res in scan_results:
            f.write(f"{res['endpoint']}, {res['latency']:.2f} ms\n")
    print(f"\n--> Full scan results saved to '{RESULT_FILENAME}'")

    # Step 3: Final action
    print("\n[Step 3/3] Initial scan complete. Choose next action:")
    print("  1. Run Scan (Generate Amnezia configs for the top 35 endpoints)")
    print("  2. Finish Scan (Exit after saving ping results)")
    next_action = get_user_choice("Enter your choice (1-2): ", [1, 2])
    
    if next_action == 1:
        top_35_endpoints = [res['endpoint'] for res in scan_results[:35]]
        if not top_35_endpoints:
            print("No endpoints found to generate configs.")
        else:
            create_amnezia_zip(account_data, private_key, top_35_endpoints)
    
    print("\nProcess complete!")
    input("Press Enter to exit.")

if __name__ == "__main__":
    main()
