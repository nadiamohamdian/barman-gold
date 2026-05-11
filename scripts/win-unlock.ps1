# Kill common lockers
taskkill /F /IM node.exe /T > $null 2>&1
taskkill /F /IM Code.exe /T > $null 2>&1

# Remove locked SWC binary folder safely if exists
$swc = "node_modules\.pnpm\@next+swc-win32-x64-msvc@15.5.0"
if (Test-Path $swc) { 
    attrib -R "$swc\*" -Recurse
    rd /s /q $swc 
}

# Optional: disable native SWC to avoid future locks
setx NEXT_DISABLE_SWC_NATIVE "1" > $null 2>&1

Write-Host "Windows unlock completed. You can now run pnpm install safely."
