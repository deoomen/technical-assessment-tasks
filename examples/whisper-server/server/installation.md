
# Detailed Installation Instructions

This guide explains the new project structure, where initialization is split into three scripts: 
- **model_init.sh** – downloads, compiles, and installs the Whisper model (and builds whisper.cpp), 
- **server_init.sh** – installs backend dependencies and starts the server, 
- ~~**frontend_init.sh** – (optional) installs dependencies and starts the frontend.~~

The guide also uses **nvm** to manage Node.js 18 (instead of a global installation).

---

## 1. Install Required System Packages

### Linux (Ubuntu/Debian)
```bash
# Basic tools
sudo apt update
sudo apt install -y build-essential cmake git ffmpeg curl

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc

# Verify nvm is installed:
nvm --version

# Install and use Node.js 18 with nvm:
nvm install 18
nvm use 18

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
```

### macOS
```bash
# Install Homebrew if not already installed:
 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Basic tools
brew install cmake git ffmpeg

# Install NVM (Node Version Manager)
brew install nvm
# Add these lines to your ~/.zshrc or ~/.bashrc:
echo "export NVM_DIR=\"$HOME/.nvm\"" >> ~/.zshrc
echo "[ -s \"/usr/local/opt/nvm/nvm.sh\" ] && . \"/usr/local/opt/nvm/nvm.sh\"" >> ~/.zshrc
source ~/.zshrc

# Install and use Node.js 18 with nvm:
nvm install 18
nvm use 18
```
IMPORTANT
using the `nvm` allow us to run nodejs 18.x.x projects with global installation of newer packages while the nodejs was installed by `npm` command. So there is no need to downgrade the nodejs to version 18. If you have globally installed `latest` nodejs use inside the `server/` folder

```bash
nvm use 18   # or
nvm use   # as there is a .nvmrc file created inside the directory
```
Install pnpm

```bash
# Install pnpm
brew install pnpm
```

### Windows
1. Install [Git for Windows](https://gitforwindows.org/).
2. Install [NVM for Windows](https://github.com/coreybutler/nvm-windows/releases) (follow the installer instructions).
3. Open PowerShell or CMD as administrator:
   ```powershell
   nvm install 18
   nvm use 18
   ```
4. Install [CMake](https://cmake.org/download/) and [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
5. Install [FFmpeg](https://www.gyan.dev/ffmpeg/builds/) and ensure it’s in your PATH.
6. Install pnpm:
   ```powershell
   iwr https://get.pnpm.io/install.ps1 -useb | iex
   refreshenv
   ```

---

## 3. Model Initialization: `model_init.sh`

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Run the script:
   ```bash
   ./model_init.sh
   or
   bash model_init.sh
   ```
   *If the script lacks execute permissions with `./model_init.sh` command, run:*
   ```bash
   chmod +x model_init.sh
   ./model_init.sh
   ```
   The script will:
   - Check for required tools (node, pnpm, curl, git, cmake),
   - Create directories: `uploads`, `models`, and `build`,
   - Allow you to select and download a Whisper model (with size verification),
   - Optionally clone, build, and install whisper.cpp (when prompted: “Do you want to compile whisper.cpp?”).

   After completion:
   - The `models` directory will contain the selected model (e.g., `ggml-large-v3-turbo.bin`) and the compiled binary (e.g., `whisper-cli`),
   - The `build` directory will have the compilation files.

---

## 4. Server Initialization: `server_init.sh`

1. In the `server` directory, run:
   ```bash
   ./server_init.sh
   ```
   This script will:
   - Check for pnpm,
   - Install backend dependencies (`pnpm install`),
   - Start the development server on port `3001` (`pnpm dev`).

2. **Test the Server:**
   Open a new terminal and run:
   ```bash
   curl http://localhost:3001/health
   ```
   A response (e.g., “OK”) confirms that the backend is running properly.

---

## Developer Configuration

- **Backend (port 3001):**
  - Accessible at [http://localhost:3001](http://localhost:3001)
  - Accepts requests from the frontend (e.g., [http://localhost:3000](http://localhost:3000)).

---

## Troubleshooting

### "Node.js version must be 18.x"
```bash
node --version
nvm install 18 # or if installed
nvm use
```
*Remember to run `nvm use` in every new terminal session.*

### "pnpm not found"
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
```

### "ffmpeg not found"
```bash
ffmpeg -version
```
*If FFmpeg is not recognized, install it (e.g., `sudo apt install ffmpeg` on Ubuntu).*

### "Port 3000/3001 is already in use"
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Post-Installation Testing

1. **Test the Server:**
   ```bash
   cd server
   pnpm dev
   # In a new terminal:
   curl http://localhost:3001/health
   ```

(...) you can then project your own frontend application
---

This guide provides a clear and streamlined installation and configuration process using nvm for Node.js 18, with dedicated scripts for the model, server, and frontend initialization.

### MIT License

### Copyright (c) 2025 Maciej Gad | contact at `red` and `yellow` and `green` on **[div0.space]**




