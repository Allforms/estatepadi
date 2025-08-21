# bunny_storage.py
import os
import requests
from django.core.files.storage import Storage
from django.conf import settings
from django.core.files.base import ContentFile
from urllib.parse import urljoin

class BunnyStorage(Storage):
    def __init__(self):
        self.storage_zone = settings.BUNNY_STORAGE_ZONE
        self.password = settings.BUNNY_STORAGE_PASSWORD
        self.base_url = settings.BUNNY_CDN_URL.rstrip('/')
        self.region = getattr(settings, 'BUNNY_REGION', '')  # Optional: for regions like 'ny' or 'la'

    def _save(self, name, content):
        """Save file to Bunny.net storage"""
        print(f"=== BUNNY STORAGE CALLED ===")
        print(f"Saving file: {name}")
        print(f"Storage zone: {self.storage_zone}")
        
        # Construct the upload URL
        if self.region:
            upload_url = f"https://{self.region}.storage.bunnycdn.com/{self.storage_zone}/{name}"
        else:
            upload_url = f"https://storage.bunnycdn.com/{self.storage_zone}/{name}"
        
        headers = {
            "AccessKey": self.password,
            "Content-Type": "application/octet-stream"
        }
        
        # Handle both file objects and content
        if hasattr(content, 'read'):
            data = content.read()
        else:
            data = content
            
        response = requests.put(upload_url, headers=headers, data=data)
        
        if response.status_code not in [200, 201]:
            raise Exception(f"Upload failed with status code {response.status_code}: {response.text}")
        
        return name

    def _open(self, name, mode='rb'):
        """Open a file from Bunny.net storage"""
        url = self.url(name)
        response = requests.get(url)
        if response.status_code == 200:
            return ContentFile(response.content)
        raise FileNotFoundError(f"File {name} not found")

    def delete(self, name):
        """Delete file from Bunny.net storage"""
        if self.region:
            delete_url = f"https://{self.region}.storage.bunnycdn.com/{self.storage_zone}/{name}"
        else:
            delete_url = f"https://storage.bunnycdn.com/{self.storage_zone}/{name}"
            
        headers = {"AccessKey": self.password}
        response = requests.delete(delete_url, headers=headers)
        
        if response.status_code not in [200, 404]:  # 404 means already deleted
            raise Exception(f"Delete failed with status code {response.status_code}: {response.text}")

    def exists(self, name):
        """Check if file exists in Bunny.net storage"""
        if self.region:
            check_url = f"https://{self.region}.storage.bunnycdn.com/{self.storage_zone}/{name}"
        else:
            check_url = f"https://storage.bunnycdn.com/{self.storage_zone}/{name}"
            
        headers = {"AccessKey": self.password}
        response = requests.head(check_url, headers=headers)
        return response.status_code == 200

    def listdir(self, path):
        """List directory contents (optional implementation)"""
        if self.region:
            list_url = f"https://{self.region}.storage.bunnycdn.com/{self.storage_zone}/{path}/"
        else:
            list_url = f"https://storage.bunnycdn.com/{self.storage_zone}/{path}/"
            
        headers = {"AccessKey": self.password}
        response = requests.get(list_url, headers=headers)
        
        if response.status_code == 200:
            # Parse the JSON response to extract file and directory names
            data = response.json()
            files = [item['ObjectName'] for item in data if not item['IsDirectory']]
            dirs = [item['ObjectName'] for item in data if item['IsDirectory']]
            return dirs, files
        return [], []

    def size(self, name):
        """Get file size"""
        if self.region:
            check_url = f"https://{self.region}.storage.bunnycdn.com/{self.storage_zone}/{name}"
        else:
            check_url = f"https://storage.bunnycdn.com/{self.storage_zone}/{name}"
            
        headers = {"AccessKey": self.password}
        response = requests.head(check_url, headers=headers)
        
        if response.status_code == 200:
            return int(response.headers.get('Content-Length', 0))
        raise FileNotFoundError(f"File {name} not found")

    def url(self, name):
        """Return the public URL for the file"""
        return f"{self.base_url}/{name}"






