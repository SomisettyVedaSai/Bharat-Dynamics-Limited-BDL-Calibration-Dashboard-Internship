$ErrorActionPreference = "Stop"

Write-Host "Updating MongoDB configuration..."
$file = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg"
$content = Get-Content $file -Raw

if ($content -match "#replication:") {
    $content = $content -replace "#replication:", "replication:`r`n  replSetName: `"rs0`""
    Set-Content -Path $file -Value $content
    Write-Host "Config updated!"
} else {
    Write-Host "Config already updated or #replication not found."
}

Write-Host "Restarting MongoDB service..."
Restart-Service -Name MongoDB -Force

Write-Host "Waiting for MongoDB to start..."
Start-Sleep -Seconds 5

Write-Host "Initiating Replica Set..."
mongosh --eval "rs.initiate()"

Write-Host "Done! You can close this window now."
Start-Sleep -Seconds 3
