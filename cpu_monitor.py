import asyncio
import websockets
import psutil
import time
import json


CPU_THRESHOLD = 0
CHECK_INTERVAL = 1
FLAT_LINE_THRESHOLD = 5
FLUCTUATION_THRESHOLD = 16.5


previous_cpu_usage = 0
consecutive_high_usage_count = 0
last_alert_time = 0
ALERT_COOLDOWN = 30


async def send_alert(websocket, message, cpu_usage):
    """Send an alert message through WebSocket"""
    data = {
        "alert": message,
        "cpu_usage": cpu_usage,
        "timestamp": time.time(),
        "status": "alert"
    }
    try:
        await websocket.send(json.dumps(data))
        print(f"Sent alert: {message}")
    except Exception as e:
        print(f"Error sending alert: {e}")


async def send_status_update(websocket, cpu_usage):
    """Send periodic status updates (only when above threshold)"""
    data = {
        "cpu_usage": cpu_usage,
        "timestamp": time.time(),
        "status": "update"
    }
    try:
        await websocket.send(json.dumps(data))
    except Exception as e:
        print(f"Error sending status update: {e}")


async def monitor_system_resources(websocket):
    global previous_cpu_usage, consecutive_high_usage_count, last_alert_time

    while True:
        current_cpu_usage = psutil.cpu_percent(interval=CHECK_INTERVAL)
        current_time = time.time()

        print(f"Current CPU Usage: {current_cpu_usage}%")

        if current_cpu_usage > CPU_THRESHOLD:
            if abs(current_cpu_usage - previous_cpu_usage) < FLUCTUATION_THRESHOLD:
                consecutive_high_usage_count += 1

                # await send_status_update(websocket, current_cpu_usage)

                if consecutive_high_usage_count >= FLAT_LINE_THRESHOLD:
                    if current_time - last_alert_time > ALERT_COOLDOWN:
                        alert_msg = (
                            f"Cryptojacking detected! "
                            f"Sustained CPU usage: {current_cpu_usage}% "
                            f"for {consecutive_high_usage_count} seconds"
                        )
                        print(alert_msg)
                        await send_alert(websocket, alert_msg, current_cpu_usage)
                        last_alert_time = current_time
                        consecutive_high_usage_count = 0
            else:
                consecutive_high_usage_count = 0
        else:
            consecutive_high_usage_count = 0

        previous_cpu_usage = current_cpu_usage


async def main():
    async with websockets.serve(monitor_system_resources, "localhost", 8765):
        print("Cryptojacking detector running on ws://localhost:8765")
        print(f"Alert threshold: {CPU_THRESHOLD}% CPU for {FLAT_LINE_THRESHOLD} seconds")
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Fatal error: {e}")