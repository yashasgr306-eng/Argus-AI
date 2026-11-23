import subprocess
subprocess.run(["ping", "-c", "1", host], check=True)