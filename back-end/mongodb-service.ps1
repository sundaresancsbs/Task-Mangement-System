# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Please run this script as Administrator!"
    exit
}

# Create MongoDB service
$serviceName = "MongoDB"
$serviceExists = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if (-not $serviceExists) {
    Write-Host "Creating MongoDB service..."
    New-Service -Name $serviceName `
                -BinaryPathName "`"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe`" --config `"D:\FST Project\back-end\mongod.conf`"" `
                -DisplayName "MongoDB" `
                -StartupType Automatic `
                -Description "MongoDB Database Server"
    Write-Host "MongoDB service created successfully."
} else {
    Write-Host "MongoDB service already exists."
}

# Start the service
Write-Host "Starting MongoDB service..."
Start-Service -Name $serviceName
Write-Host "MongoDB service started." 