import os
import sys
import shutil
import subprocess

def run_command(command, cwd=None):
    print(f"Running: {command} in {cwd or '.'}")
    res = subprocess.run(command, shell=True, cwd=cwd)
    if res.returncode != 0:
        print(f"Error: Command failed with exit code {res.returncode}")
        sys.exit(res.returncode)

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")
    static_dir = os.path.join(backend_dir, "static")

    print("=== Step 1: Building React Frontend ===")
    # Ensure dependencies are compiled and built into frontend/dist
    run_command("npm run build", cwd=frontend_dir)

    print("=== Step 2: Copying Static Files to Backend ===")
    # Clear existing static folder in backend
    if os.path.exists(static_dir):
        shutil.rmtree(static_dir)
    os.makedirs(static_dir)

    frontend_dist = os.path.join(frontend_dir, "dist")
    
    # Copy all built assets to backend/static/
    for item in os.listdir(frontend_dist):
        s = os.path.join(frontend_dist, item)
        d = os.path.join(static_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)
    print("Static files copied successfully.")

    print("=== Step 3: Compiling Standalone Executable ===")
    # Install PyInstaller inside the virtual environment if not installed
    venv_pip = os.path.join(root_dir, ".venv", "Scripts", "pip")
    venv_pyinstaller = os.path.join(root_dir, ".venv", "Scripts", "pyinstaller")
    
    if not os.path.exists(venv_pyinstaller):
        run_command(f'"{venv_pip}" install pyinstaller')

    # Run PyInstaller to package backend + React static files
    # --add-data "static;static" bundles the backend/static folder into the binary
    # --noconsole keeps it running cleanly in the background, but since it's a CLI server, console helps with debugging. Let's make it console-enabled for logs.
    pyinstaller_cmd = (
        f'"{venv_pyinstaller}" --onefile --clean --add-data "static;static" '
        f'--collect-all foundry_local_sdk --collect-all foundry_local_core_winml '
        f'--collect-all onnxruntime_core --collect-all onnxruntime_genai_core '
        f'--collect-all webview '
        f'--name "LocalRAG" main.py'
    )
    run_command(pyinstaller_cmd, cwd=backend_dir)

    print("=== Step 4: Moving Executable to Root ===")
    src_exe = os.path.join(backend_dir, "dist", "LocalRAG.exe")
    dest_exe = os.path.join(root_dir, "LocalRAG.exe")

    if os.path.exists(dest_exe):
        os.remove(dest_exe)

    if os.path.exists(src_exe):
        shutil.move(src_exe, dest_exe)
        print(f"\n[SUCCESS] Compiled standalone executable created at: {dest_exe}")
        print("Double-click LocalRAG.exe to launch the application.")
    else:
        print("\n[ERROR] Compiled executable not found. Check PyInstaller outputs.")

if __name__ == "__main__":
    main()
