import psutil
import time

# Define thresholds for cryptojacking detection
CPU_THRESHOLD = 15  # Trigger cryptojacking detection if CPU usage exceeds this threshold
CHECK_INTERVAL = 1  # Check system resources every second
FLAT_LINE_THRESHOLD = 5  # Number of consecutive seconds to consider a flat line

# Store previous CPU usage and track sustained usage
previous_cpu_usage = 0
consecutive_high_usage_count = 0

def monitor_system_resources():
    global previous_cpu_usage, consecutive_high_usage_count

    while True:
        # Get the current CPU usage (percentage) every second
        current_cpu_usage = psutil.cpu_percent(interval=CHECK_INTERVAL)

        # Print the current CPU usage
        print(f"Current CPU Usage: {current_cpu_usage}%")

        # Check if the CPU usage exceeds the threshold
        if current_cpu_usage > CPU_THRESHOLD:
            # Check if the CPU usage is consistent (flat line behavior)
            if abs(current_cpu_usage - previous_cpu_usage) < 3.5:
                consecutive_high_usage_count += 1
            else:
                consecutive_high_usage_count = 0  # Reset if the CPU usage fluctuates

            # If the usage stays high for a certain number of consecutive checks, flag it
            if consecutive_high_usage_count >= FLAT_LINE_THRESHOLD:
                print("Potential cryptojacking detected! Sustained high CPU usage detected.")
                consecutive_high_usage_count = 0  # Reset after detection

        else:
            consecutive_high_usage_count = 0  # Reset if the CPU usage falls below the threshold

        # Update the previous CPU usage for the next check
        previous_cpu_usage = current_cpu_usage

if __name__ == "__main__":
    monitor_system_resources()
