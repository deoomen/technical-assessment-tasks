#!/bin/bash
# model_init.sh - Initializes whisper model for VistaCare Node.js server.
# This script performs the following tasks:
#   1. Checks prerequisites (node, pnpm, curl, git, cmake)
#   2. Verifies that Node.js version is 18.x
#   3. Creates required directories: uploads, models, build
#   4. Interactively selects a whisper model to download with size verification
#   5. Optionally clones, builds, and installs whisper.cpp (placing the binary in models)

# ---------------------
# Color settings for messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ---------------------
# Message functions
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# ---------------------
# Function to check if a command exists
check_command() {
    command -v "$1" >/dev/null 2>&1 || error_exit "$1 is required but not installed."
}

# ---------------------
# Verify that Node.js version is 18.x
verify_node_version() {
    local version
    version=$(node --version | cut -d'v' -f2)
    local major
    major=$(echo "$version" | cut -d'.' -f1)
    if [ "$major" -ne 18 ]; then
        error_exit "Node.js version must be 18.x (current: $version). Try: nvm use 18"
    fi
    success_msg "Node.js version $version verified"
}

# ---------------------
# Function to download a file using curl
download_file() {
    local url="$1"
    local output="$2"
    echo "Downloading: $url"
    curl -L -# -o "$output" "$url" || return 1
    return 0
}

# ---------------------
# Create required directories (uploads, models, build)
ensure_directories() {
    local dirs=("uploads" "models" "build")
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir" || error_exit "Cannot create directory: $dir"
            warn_msg "Created missing directory: $dir"
        fi
    done
    success_msg "Required directories verified"
}

# ---------------------
# Interactive function to select and download a whisper model with size verification
validate_model() {
    # Associative arrays for model URLs and expected sizes (in bytes)
    declare -A models
    declare -A expected_sizes

    models["1"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"
    expected_sizes["1"]=1620000000

    models["2"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin"
    expected_sizes["2"]=800000000

    models["3"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
    expected_sizes["3"]=300000000

    echo "Select the whisper model to use:"
    echo " [1] ggml-large-v3-turbo.bin (approx. 1.62GB)"
    echo " [2] ggml-medium.bin        (approx. 800MB)"
    echo " [3] ggml-small.bin         (approx. 300MB)"
    read -p "Enter option [1-3]: " option

    model_url=${models[$option]}
    expected_size=${expected_sizes[$option]}

    if [ -z "$model_url" ]; then
        error_exit "Invalid option selected. Aborting."
    fi

    output_file="$(basename "$model_url")"
    size_tolerance=100000000  # 100 MB tolerance

    echo "Selected model: $output_file"
    echo "Checking if the model file already exists in the 'models' directory..."
    if [ -f "models/$output_file" ]; then
        actual_size=$(wc -c < "models/$output_file" | tr -d '[:space:]')
        expected_min=$((expected_size - size_tolerance))
        expected_max=$((expected_size + size_tolerance))
        if [ "$actual_size" -ge "$expected_min" ] && [ "$actual_size" -le "$expected_max" ]; then
            success_msg "Model file $output_file already exists and is valid (size: $actual_size bytes)."
            read -p "Do you want to re-download and overwrite it? [y/N]: " confirm
            if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                echo "Skipping model download."
                return 0
            else
                warn_msg "Overwriting the existing model file..."
            fi
        else
            warn_msg "Existing file size ($actual_size bytes) does not match expected size ($expected_size bytes)."
            read -p "Overwrite the file? [Y/n]: " confirm2
            if [[ "$confirm2" =~ ^[Nn]$ ]]; then
                echo "Aborting model download."
                exit 0
            else
                warn_msg "Overwriting the file..."
            fi
        fi
    fi

    echo "Downloading model to: models/$output_file"
    cd models || error_exit "Cannot change to 'models' directory"
    download_file "$model_url" "$output_file" || error_exit "Failed to download model."
    success_msg "Model downloaded successfully!"
    cd - >/dev/null || error_exit "Failed to return to project directory"
}

# ---------------------
# Function to clone, compile, and install whisper.cpp
build_whisper() {
    local repo_url="https://github.com/ggerganov/whisper.cpp.git"
    local temp_dir="temp_whisper"
    local target_build_dir="build"  # docelowy katalog build w projekcie

    if [ -d "$temp_dir" ]; then
        warn_msg "Temporary directory $temp_dir already exists."
        read -p "Do you want to remove it and re-clone the repository? [Y/n]: " remove_temp
        if [[ "$remove_temp" =~ ^[Yy] ]]; then
            rm -rf "$temp_dir"
        else
            error_exit "Repository cloning aborted."
        fi
    fi

    echo "Cloning whisper.cpp repository..."
    git clone "$repo_url" "$temp_dir" || error_exit "Failed to clone whisper.cpp repository."

    cd "$temp_dir" || error_exit "Cannot enter temporary directory $temp_dir."

    warn_msg "Configuring and building whisper.cpp..."
    cmake -B build || error_exit "CMake configuration failed."
    cmake --build build --config Release || error_exit "whisper.cpp compilation failed."
    success_msg "whisper.cpp compiled successfully."

    cd .. || error_exit "Failed to return to project directory"
    
    # Przeniesienie folderu build z temp_whisper do docelowego katalogu build
    echo "Copying build directory to target location..."
    # Usuń istniejący target_build_dir, jeśli istnieje
    if [ -d "$target_build_dir" ]; then
        rm -rf "$target_build_dir"
    fi
    cp -r "$temp_dir/build" "$target_build_dir" || error_exit "Failed to copy build directory."
    success_msg "Build directory successfully copied to '$target_build_dir'."
    
    # Dodatkowo, jeśli potrzebujemy skopiować konkretny binary do katalogu models:
    local binary_path=""
    if [ -f "$temp_dir/build/whisper" ]; then
        binary_path="$temp_dir/build/whisper"
    elif [ -f "$temp_dir/build/bin/whisper-cli" ]; then
        binary_path="$temp_dir/build/bin/whisper-cli"
    fi
    if [ -n "$binary_path" ]; then
        echo "Copying compiled binary to models directory..."
        cp "$binary_path" models/ || error_exit "Failed to copy compiled binary."
        success_msg "Compiled whisper binary is now located in 'models'."
    else
        warn_msg "Compiled binary not found in expected locations; skipping binary copy."
    fi

    # Clean up temporary directory
    rm -rf "$temp_dir"
    success_msg "Temporary source directory cleaned up."
}

# ---------------------
# Main execution for model_init.sh

echo "🔍 Checking prerequisites..."
check_command node
check_command pnpm
check_command curl
check_command git
check_command cmake

echo "🔍 Verifying Node.js version..."
verify_node_version

echo "🔍 Ensuring required directories exist..."
ensure_directories

echo "🔍 Validating and downloading whisper model..."
validate_model

arch=$(uname -m)
echo "Detected architecture: $arch"

read -p "Do you want to compile whisper.cpp? (This will clone the repository, build, and copy the output to 'models') [Y/n]: " build_choice
if [[ "$build_choice" =~ ^[Yy] ]]; then
    build_whisper
else
    warn_msg "whisper.cpp compilation skipped. Ensure that the required binary is placed in 'models'."
fi

echo -e "${GREEN}Model initialization completed successfully.${NC}"
