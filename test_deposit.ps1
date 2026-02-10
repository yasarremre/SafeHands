$ErrorActionPreference = "Stop"

Write-Host "Testing Deposit via CLI..."

$ContractId = "CDU6Z7BIJM52B7IPG2EXSNKWDPX73HZRXG7XPRQTJLYFUSRUWWFCRTD3"
$Identity = "deployer"
$Network = "testnet"

# Get Identity Address
$DeployerAddress = soroban keys address $Identity

Write-Host "User: $DeployerAddress" 
Write-Host "Contract: $ContractId"

# Native Token (Testnet)
# Native Token (Testnet)
# $Token = "CDLZFC3SYJYDZT7KQLSZZQ754175QYYJ5PSQSRJCJRSH6JWWKAOW754O"
$Token = $ContractId # Test if C-address (Self) works
$Amount = "100"

Write-Host "Invoking deposit..."

$Amount = "100"

Write-Host "Invoking deposit..."

# Construct arguments manually to avoid splatting issues
$CmdArgs = @(
    "contract", "invoke",
    "--id", $ContractId,
    "--source", $Identity,
    "--network", $Network,
    "--",
    "deposit",
    "--client", $DeployerAddress,
    "--freelancer", $DeployerAddress,
    "--arbiter", $DeployerAddress,
    "--token", $Token,
    "--amount", $Amount
)

Write-Host "Command: soroban $CmdArgs"

try {
    & soroban $CmdArgs
    Write-Host "Deposit Successful!"
} catch {
    Write-Host "Deposit Failed!"
    Write-Host $_
}
