import requests
import json
import getpass

# Base API URL
API_URL = "https://packetfence.mckinnon.tech/api/v1"

# Step 1: Get Admin Credentials
admin_username = input("Enter PacketFence Admin Username: ")
admin_password = getpass.getpass("Enter PacketFence Admin Password: ")  # Securely input password

# Step 2: Authenticate and Get Token
login_payload = {
    "username": admin_username,
    "password": admin_password
}

response = requests.post(f"{API_URL}/login", json=login_payload)

if response.status_code == 200:
    token = response.json().get("token")
    headers = {"Authorization": token, "Content-Type": "application/json"}
    print("[✅] Authentication successful! Token acquired.")
else:
    print(f"[❌] Authentication failed! {response.text}")
    exit(1)

# Step 3: Collect New User Information
print("\n[🔹] Enter details for the new user:")
pid = input("User ID (PID): ")
email = input("Email: ")
sponsor = input("Sponsor (Default: admin): ") or "admin"
unreg_date = input("Unregistration Date (YYYY-MM-DD HH:MM:SS): ")

# Step 4: Create New User
user_payload = {
    "email": email,
    "notes": "Created via API",
    "pid": pid,
    "sponsor": sponsor
}

user_response = requests.post(f"{API_URL}/users", headers=headers, json=user_payload)

if user_response.status_code == 201:
    print("[✅] User created successfully!")
else:
    print(f"[❌] Failed to create user! {user_response.text}")
    exit(1)

# Step 5: Set User Password and Assign Category/Role
password = getpass.getpass(f"Enter password for {pid}: ")

password_payload = {
    "category": "2",
    "unregdate": unreg_date,
    "login_remaining": 0,
    "password": password,
    "pid": pid
}

password_response = requests.post(f"{API_URL}/user/{pid}/password", headers=headers, json=password_payload)

if password_response.status_code == 201:
    print("[✅] Password, guest role, and unregistration date set successfully!")
else:
    print(f"[❌] Failed to update user settings! {password_response.text}")
    exit(1)

