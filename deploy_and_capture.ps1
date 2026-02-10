$ErrorActionPreference = "Stop"
Write-Host "Deploying Debug Contract..."

# Deploy and capture output
$Output = soroban contract deploy --wasm contracts/target/wasm32-unknown-unknown/release/safe_hands_contract.wasm --source deployer --network testnet

# The output should be just the Contract ID string
Write-Host "Raw Output: $Output"

# Trim whitespace
$ContractId = $Output.Trim()

# Verify length (StrKey Contract ID is 56 chars usually starting with C)
if ($ContractId.Length -eq 56) {
    Write-Host "✅ Valid Contract ID detected: $ContractId"
    $ContractId | Out-File -FilePath "contract_id.txt" -NoNewline -Encoding ascii
} else {
    Write-Host "❌ Invalid Contract ID length: $($ContractId.Length). Output might be mixed with logs."
    # Try to extract regex
    if ($Output -match "C[A-Z0-9]{55}") {
        $Matches[0] | Out-File -FilePath "contract_id.txt" -NoNewline -Encoding ascii
        Write-Host "⚠️ Extracted ID from log: $($Matches[0])"
    } else {
        Write-Host "Could not find valid ID."
    }
}
