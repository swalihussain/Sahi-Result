Write-Host "Monitoring for changes every 10 seconds..." -ForegroundColor Cyan
while ($true) {
    # Check for changes
    $status = git status --porcelain
    if ($status) {
        Write-Host "Changes detected at $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss')). Syncing to GitHub..." -ForegroundColor Yellow
        git add .
        git commit -m "Auto-sync: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
        git push origin main
        Write-Host "Sync complete!" -ForegroundColor Green
    }
    Start-Sleep -Seconds 10
}
