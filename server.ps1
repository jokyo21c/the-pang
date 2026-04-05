$port = 8082
$root = $PSScriptRoot

# Create uploads directory if it doesn't exist
$uploadDir = Join-Path $root 'admin\uploads'
if (-not (Test-Path $uploadDir)) {
    New-Item -ItemType Directory -Path $uploadDir | Out-Null
    Write-Host "Created uploads directory: $uploadDir" -ForegroundColor Cyan
}

# Kill any existing process using port $port
$existingPid = (netstat -ano 2>$null | Select-String ":$port\s" | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
if ($existingPid -and $existingPid -ne $PID) {
    try {
        Stop-Process -Id ([int]$existingPid) -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        Write-Host "  Stopped existing process on port $port (PID: $existingPid)" -ForegroundColor Yellow
    } catch {}
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://+:$port/")

try {
    $listener.Start()
    Write-Host "====================================================" -ForegroundColor Green
    Write-Host "  Server started at http://localhost:$port/"         -ForegroundColor Green
    Write-Host "  Upload endpoint: POST http://localhost:$port/upload" -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Green
} catch {
    # Fallback: try localhost only
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://localhost:$port/")
    try {
        $listener.Start()
        Write-Host "====================================================" -ForegroundColor Green
        Write-Host "  Server started at http://localhost:$port/ (localhost only)" -ForegroundColor Green
        Write-Host "  Upload endpoint: POST http://localhost:$port/upload" -ForegroundColor Cyan
        Write-Host "====================================================" -ForegroundColor Green
    } catch {
        Write-Host "====================================================" -ForegroundColor Red
        Write-Host "[ERROR] Server startup failed!"                        -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)"                        -ForegroundColor Yellow
        Write-Host "====================================================" -ForegroundColor Red
        Start-Sleep -Seconds 5
        exit 1
    }
}

function Get-ContentType($ext) {
    switch ($ext.ToLower()) {
        ".html"  { return "text/html; charset=utf-8" }
        ".css"   { return "text/css; charset=utf-8" }
        ".js"    { return "application/javascript; charset=utf-8" }
        ".json"  { return "application/json; charset=utf-8" }
        ".png"   { return "image/png" }
        ".jpg"   { return "image/jpeg" }
        ".jpeg"  { return "image/jpeg" }
        ".gif"   { return "image/gif" }
        ".svg"   { return "image/svg+xml" }
        ".ico"   { return "image/x-icon" }
        ".webp"  { return "image/webp" }
        ".mp4"   { return "video/mp4" }
        ".webm"  { return "video/webm" }
        ".mov"   { return "video/quicktime" }
        ".avi"   { return "video/x-msvideo" }
        ".woff"  { return "font/woff" }
        ".woff2" { return "font/woff2" }
        ".ttf"   { return "font/ttf" }
        default  { return "application/octet-stream" }
    }
}

while ($listener.IsListening) {
    try {
        $context  = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response

        # CORS headers for all responses
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        # OPTIONS preflight
        if ($request.HttpMethod -eq 'OPTIONS') {
            $response.StatusCode = 200
            $response.ContentLength64 = 0
            $response.Close()
            continue
        }

        # ── POST /upload ────────────────────────────────────────
        if ($request.HttpMethod -eq 'POST' -and $request.Url.AbsolutePath -eq '/upload') {
            try {
                $bodyReader = [System.IO.StreamReader]::new($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $bodyReader.ReadToEnd()
                $payload = $body | ConvertFrom-Json

                # Sanitize filename and generate unique name
                $origName  = [System.IO.Path]::GetFileName($payload.filename) -replace '[^\w\.\-]', '_'
                $ext       = [System.IO.Path]::GetExtension($origName)
                $timestamp = (Get-Date -Format 'yyyyMMdd_HHmmssff')
                $saveName  = "${timestamp}${ext}"
                $savePath  = Join-Path $uploadDir $saveName

                # Strip data URL prefix and decode base64
                $base64Data = $payload.data -replace '^data:[^;]+;base64,', ''
                $bytes = [Convert]::FromBase64String($base64Data)
                [System.IO.File]::WriteAllBytes($savePath, $bytes)

                $sizeKB = [Math]::Round($bytes.Length / 1024, 1)
                Write-Host "  [UPLOAD] Saved: $saveName ($sizeKB KB)" -ForegroundColor Cyan

                $responseJson = "{`"ok`":true,`"url`":`"/admin/uploads/$saveName`"}"
                $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($responseJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $responseBytes.Length
                $response.OutputStream.Write($responseBytes, 0, $responseBytes.Length)

            } catch {
                Write-Host "  [UPLOAD ERROR] $($_.Exception.Message)" -ForegroundColor Red
                $errorJson = "{`"ok`":false,`"error`":`"$($_.Exception.Message -replace '`"','\`"')`"}"
                $errorBytes = [System.Text.Encoding]::UTF8.GetBytes($errorJson)
                $response.StatusCode = 500
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $errorBytes.Length
                $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
            }

        # ── GET  static files ───────────────────────────────────
        } elseif ($request.HttpMethod -eq 'GET') {
            $urlPath = $request.Url.AbsolutePath
            if ($urlPath -eq '/' -or $urlPath -eq '') { $urlPath = '/index.html' }

            $filePath = Join-Path $root ($urlPath.TrimStart('/').Replace('/', '\'))

            if (Test-Path $filePath -PathType Leaf) {
                $ext         = [System.IO.Path]::GetExtension($filePath)
                $contentType = Get-ContentType $ext
                $bytes       = [System.IO.File]::ReadAllBytes($filePath)

                $response.ContentType    = $contentType
                $response.ContentLength64 = $bytes.Length
                try {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } catch {
                    # 브라우저가 비디오 재생 대기 중 연결을 끊는 흔한 스트리밍 동작 무시
                }
            } else {
                $notFound    = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
                $response.StatusCode      = 404
                $response.ContentType    = "text/plain"
                $response.ContentLength64 = $notFound.Length
                $response.OutputStream.Write($notFound, 0, $notFound.Length)
            }
        }

        $response.Close()

    } catch {
        # Ignore client disconnect errors
        $errMsg = $_.Exception.Message
        if ($errMsg -notmatch 'forcibly closed|existing connection|네트워크|I/O|Write') {
            Write-Host "Server error: $errMsg" -ForegroundColor Yellow
        }
    }
}
