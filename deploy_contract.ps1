Write-Host "SafeHands Deployment Helper" -ForegroundColor Cyan

# Add Cargo Bin to Path for this session
$CargoBinPath = "$env:USERPROFILE\.cargo\bin"
if ($Env:Path -notlike "*$CargoBinPath*") {
    Write-Host "Adding Cargo Bin to Path: $CargoBinPath"
    $Env:Path += ";$CargoBinPath"
}

# Check for Rust
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Rust/Cargo is not installed." -ForegroundColor Red
    exit 1
}

# Install Soroban CLI
Write-Host "Installing/Updating Soroban CLI..."
cargo install --locked soroban-cli

# Generate Identity
Write-Host "Configuring deployer identity..."
soroban config identity generate --global deployer

# Fund Identity
Write-Host "Funding deployer account..."
try {
    soroban config identity fund deployer --network testnet
} catch {
    Write-Host "Funding might have failed or already funded. Continuing..."
}

# Build Contract
Write-Host "Building Smart Contract..."
cargo build --target wasm32-unknown-unknown --release

# Deploy
Write-Host "Deploying to Stellar Testnet..."
$contractId = soroban contract deploy --wasm target/wasm32-unknown-unknown/release/safe_hands_contract.wasm --source deployer --network testnet

Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "Contract ID: $contractId" -ForegroundColor Green
Write-Host "Please copy this ID and update frontend/utils/soroban.ts"
