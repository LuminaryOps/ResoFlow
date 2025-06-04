#!/usr/bin/env python3
"""
ResoFlow - Resolume Remote Controller
Just run this script and access from your iPhone!
"""

import http.server
import socketserver
import socket
import os
import webbrowser
import threading
import time

def get_local_ip():
    """Get the local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def start_server(port=80):
    """Start the web server"""
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        httpd.serve_forever()

def main():
    # Try port 80 first, fallback to 8000 if needed
    port = 80
    try:
        # Test if port 80 is available
        test_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        test_socket.bind(('', port))
        test_socket.close()
    except:
        port = 8000
        print(f"⚠️  Port 80 in use, using port {port} instead")
    
    local_ip = get_local_ip()
    url = f"http://{local_ip}" if port == 80 else f"http://{local_ip}:{port}"
    
    # Clear screen and show info
    os.system('cls' if os.name == 'nt' else 'clear')
    
    print("="*60)
    print("🎬 ResoFlow - Resolume Remote Controller")
    print("="*60)
    print(f"\n✅ Starting web server...")
    print(f"\n📱 On your iPhone/iPad:")
    print(f"   1. Connect to the same WiFi network")
    print(f"   2. Open Safari")
    print(f"   3. Go to: {url}")
    print(f"\n🎛️  In the app, connect to: {local_ip}:8080")
    print("\n" + "-"*60)
    print("📊 Status: Running")
    print("🛑 Press Ctrl+C to stop")
    print("="*60)
    
    # Open in browser after a short delay
    def open_browser():
        time.sleep(1)
        webbrowser.open(url)
    
    threading.Thread(target=open_browser).start()
    
    # Start server
    try:
        start_server(port)
    except KeyboardInterrupt:
        print("\n\n✋ Server stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
