# Detailed Installation Instructions

This guide explains the new project structure, where initialization is split into three scripts:
- **model_init.sh** – downloads, compiles, and installs the Whisper model (and builds whisper.cpp),
- **server_init.sh** – installs backend dependencies and starts the server,
- **frontend_init.sh** – (optional) installs dependencies and starts the frontend.

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
npm install nvm

# Add these lines to your ~/.zshrc or ~/.bashrc:
echo "export NVM_DIR=\"$HOME/.nvm\"" >> ~/.zshrc
echo "[ -s \"/usr/local/opt/nvm/nvm.sh\" ] && . \"/usr/local/opt/nvm/nvm.sh\"" >> ~/.zshrc
source ~/.zshrc

# Install and use Node.js 18 with nvm:
nvm install 18
nvm use 18

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
