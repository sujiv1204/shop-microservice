# Distributed Microservices Shop on KVM

A professional 3-Tier Distributed E-Commerce Application deployed across isolated KVM Virtual Machines. This project demonstrates a decoupled microservices architecture using Node.js, Express, MongoDB, Nginx, and Docker, with a strong focus on **Virtualization Networking** and **Inter-Service Communication**.

---

## Architecture Overview

The system is architected to simulate a real-world production environment where components are physically separated across different servers (VMs) for security and scalability.

## Server Specifications & Requirements

### **Host Environment (Development Machine)**

The entire distributed infrastructure is hosted on a single physical machine using Type-1 Hypervisor technology.

- **OS:** Kubuntu 22.04 LTS (Jammy Jellyfish)
- **Virtualization Platform:** KVM/QEMU managed via `virt-manager`.
- **Processor:** 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz (4 Cores, 8 Threads).
- **Memory (RAM):** 16 GB DDR4.
- **Architecture:** x86_64.

### **Virtual Machine Allocation**

To ensure stability while running three simultaneous servers alongside the host OS, resources were allocated as follows:

| Machine  | Role     | vCPU Allocation | RAM Allocation | Storage | OS                  |
| :------- | :------- | :-------------- | :------------- | :------ | :------------------ |
| **VM 1** | Frontend | 1 vCPU          | 2048 MB (2 GB) | 10 GB   | Ubuntu Server 22.04 |
| **VM 2** | Backend  | 1 vCPU          | 2048 MB (2 GB) | 10 GB   | Ubuntu Server 22.04 |
| **VM 3** | Database | 1 vCPU          | 2048 MB (2 GB) | 10 GB   | Ubuntu Server 22.04 |

**Resource Utilization Summary:**

- **Total vCPUs Assigned:** 3 out of 8 threads (Leaving 5 for Host).
- **Total RAM Assigned:** 6 GB out of 16 GB (Leaving ~10 GB for Host).
- _This configuration ensures smooth operation of the host system while the microservices cluster is fully active._

### **Software Dependencies**

**On Host Machine:**

- `git` (Version Control)
- `virt-manager` (GUI for KVM/QEMU)
- `openssh-client` (For remote management)

**On Virtual Machines:**

- `docker.io` (Container Runtime)
- `docker-compose-plugin` (Orchestration)
- `netplan.io` (Network Configuration)

---

## Networking & Communication Strategy

We moved away from hardcoded configurations to a fully dynamic setup, utilizing Environment Variables and Static IP addressing.

### **1. VM Networking**

To ensure reliability, we bypassed DHCP and assigned Static IPs using **Netplan**.

- **Network:** `192.168.122.0/24` (KVM Default NAT)
- **Gateway:** `192.168.122.1`

### **2. Service Communication Flow**

- **Frontend -> Backend:** The Node.js UI (VM 1) queries the Backend API Gateway (VM 2) via HTTP.
- **Backend -> Backend:** The **Order Service** (VM 2) internally requests stock deduction from the **Inventory Service** (VM 2).
- **Backend -> Database:** All services persist data to the shared MongoDB instance on **VM 3**.

---

## Infrastructure Configuration (Run on VMs)

Before deploying the code, the VMs must be configured with specific networking and software.

### **Step 0: VM Provisioning (Prerequisites)**

Before configuring the software, create 3 Virtual Machines using **virt-manager** with the following settings:

1.  **ISO Image:** Use **Ubuntu Server 22.04 LTS** (Live Server).
2.  **Resources:** Assign **2GB RAM** and **1 vCPU** per VM.
3.  **Network Selection:** Ensure the Network Interface is set to **"Virtual network 'default' : NAT"**.
    - _Note:_ This ensures the VMs are placed on the `192.168.122.x` subnet required for our Static IP configuration.
4.  **OS Installation:** Proceed with the standard Ubuntu installation.
    - _Tip:_ Enable "Install OpenSSH Server" during setup to allow remote access immediately.

### **Step 1: Network Configuration (Static IP)**

_Run this on **EACH** VM, changing the IP address to `.10`, `.11`, or `.12` respectively._

1.  Edit the Netplan configuration:

    ```bash
    sudo nano /etc/netplan/00-installer-config.yaml
    ```

2.  Paste the following configuration (Ensure indentation is correct):

    ```yaml
    network:
        ethernets:
            enp1s0: # Verify interface name with 'ip addr'
                dhcp4: no
                addresses:
                    - 192.168.122.10/24 # <--- CHANGE THIS (.10, .11, or .12)
                routes:
                    - to: default
                      via: 192.168.122.1
                nameservers:
                    addresses: [8.8.8.8, 192.168.122.1]
        version: 2
    ```

3.  Apply the changes:
    ```bash
    sudo netplan apply
    ```

### **Step 2: Software Installation**

_Run these commands on **ALL THREE** VMs to install the Docker runtime._

```bash
# Update repositories
sudo apt update

# Install Docker Engine
sudo apt install docker.io -y

# Enable Docker to start on boot
sudo systemctl enable --now docker

# Add current user to Docker group (avoids using 'sudo' for docker commands)
sudo usermod -aG docker $USER
# NOTE: Log out and log back in for this to take effect

# Install Docker Compose Plugin
sudo apt install docker-compose-plugin -y

```

---

## Project Setup (Run on Host Machine)

Since the application logic is fully developed, start by cloning the repository to your local machine to prepare the files for deployment.

1.  **Clone the Repository:**

    ```bash
    git clone "https://github.com/sujiv1204/shop-microservice.git"
    cd shop-microservice
    ```

2.  **Verify Directory Structure:**
    Ensure the following folders are present and ready for transfer to the VMs:
    - `backend/` (Contains Inventory, Order, Cart services & Docker Compose)
    - `frontend/` (Contains UI code, Nginx Config & Docker Compose)
    - `database/` (Contains Seed Scripts)

3.  **Review Configuration:**
    The `docker-compose.yml` files are pre-configured with the standard KVM IP addresses (`192.168.122.x`). If your network setup differs, update the environment variables in these files before transferring.

---

## Deployment Instructions

### **Phase 1: Database Deployment (VM 3)**

We persist data using a Docker Volume.

1. SSH into VM 3 (`192.168.122.12`).
2. Run the MongoDB container:

```bash
sudo docker run -d \
  --name mongo-db \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:latest

```

### **Phase 2: Backend Deployment (VM 2)**

Transfer the microservices code and launch the cluster.

1. **Transfer Files (From Host):**

```bash
scp -r backend/ <user>@192.168.122.11:~/backend

```

2. **Launch Cluster (On VM 2):**

```bash
ssh <user>@192.168.122.11
cd ~/backend
sudo docker compose up -d --build

```

### **Phase 3: Frontend Deployment (VM 1)**

Transfer the UI code and launch the Nginx Gateway.

1. **Transfer Files (From Host):**

```bash
scp -r frontend/ <user>@192.168.122.10:~/frontend

```

2. **Launch Gateway (On VM 1):**

```bash
ssh <user>@192.168.122.10
cd ~/frontend
sudo docker compose up -d --build

```

### **Phase 4: Accessing the Application**

Since the VMs are on a private network, use **SSH Port Forwarding** to access the site securely from your laptop.

```bash
# Forward Host Port 8080 -> VM 1 Port 80
ssh -L 8080:localhost:80 <user>@192.168.122.10

```

**URL:** `http://localhost:8080`

---

## Database Seeding (Hot-Swappable Data)

We implemented a dynamic seeding script to modify inventory on the fly without restarting services.

1. **Edit Data:** Update `database/seed.js` on your Host Machine.
2. **Inject Data:** Transfer and execute the script inside the running DB container.

```bash
# Transfer script
scp database/seed.js <user>@192.168.122.12:~/seed.js

# Execute inside container
ssh <user>@192.168.122.12 "sudo docker exec -i mongo-db mongosh localhost:27017/shopdb < seed.js"

```

3. **Result:** Refresh the website to see the new inventory instantly.

---

## Verification & Troubleshooting

After deploying the services, verify the internal network connectivity. A good practice is to test **from VM 3 (Database)** since it sits at the bottom of the architecture and should be able to reach the upper layers.

1.  **SSH into VM 3:**

    ```bash
    ssh <user>@192.168.122.12
    ```

2.  **Test Network Reachability (Ping):**
    Ensure the Virtual Switch is routing packets correctly.

    ```bash
    # Ping Frontend (VM 1)
    ping -c 3 192.168.122.10

    # Ping Backend (VM 2)
    ping -c 3 192.168.122.11
    ```

3.  **Test Application Layer (Curl):**
    Verify that the ports are open and the Node.js services are responding.

    ```bash
    # Test Nginx Gateway (Should return HTTP 200)
    curl -I http://192.168.122.10

    # Test Inventory Service (Should return JSON product list)
    curl http://192.168.122.11:3001/products
    ```

## Project Structure

```text
/shop-microservice
├── /backend                 # [VM 2] Backend Cluster
│   ├── /inventory-service   # Node.js Service (Port 3001)
│   ├── /order-service       # Node.js Service (Port 3002)
│   ├── /cart-service        # Node.js Service (Port 3003)
│   └── docker-compose.yml   # Docker Orchestration & Env Vars
│
├── /frontend                # [VM 1] Frontend Gateway
│   ├── /views               # EJS HTML Templates
│   ├── server.js            # Node.js Server (Internal Port 3000)
│   ├── nginx.conf           # Reverse Proxy Config (Public Port 80)
│   └── docker-compose.yml   # Frontend Orchestration
│
├── /database                # [Host -> VM 3] Data Tools
│   └── seed.js              # Database population script
│
└── README.md

```
