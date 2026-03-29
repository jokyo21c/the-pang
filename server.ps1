$port = 8081
$root = $PSScriptRoot

try {
    $tcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
    $tcpListener.Start()
    Write-Host "Server started at http://localhost:$port/" -ForegroundColor Green
} catch {
    Write-Host "===================================================" -ForegroundColor Red
    Write-Host "[ERROR] Server startup failed!" -ForegroundColor Red
    Write-Host "Port $port is already in use by another process." -ForegroundColor Yellow
    Write-Host "Please close the existing server or change the port." -ForegroundColor Yellow
    Write-Host "===================================================" -ForegroundColor Red
    Start-Sleep -Seconds 5
    exit 1
}

while ($true) {
    if ($tcpListener.Pending()) {
        $client = $tcpListener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream)
        
        # Read the request line
        $requestLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($requestLine)) {
            $client.Close()
            continue
        }
        
        $method, $path, $protocol = $requestLine -split ' '
        if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }
        
        $filePath = Join-Path $root $path.TrimStart('/')
        
        $response = ""
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css" { "text/css; charset=utf-8" }
                ".js" { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png" { "image/png" }
                ".jpg" { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".gif" { "image/gif" }
                ".svg" { "image/svg+xml" }
                ".ico" { "image/x-icon" }
                ".webp" { "image/webp" }
                ".woff" { "font/woff" }
                ".woff2" { "font/woff2" }
                ".ttf" { "font/ttf" }
                default { "application/octet-stream" }
            }
            
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response = "HTTP/1.1 200 OK`r`n" +
            "Content-Type: $contentType`r`n" +
            "Content-Length: $($bytes.Length)`r`n" +
            "Connection: close`r`n`r`n"
                        
            $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($response)
            $stream.Write($responseBytes, 0, $responseBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        }
        else {
            $msg = "404 Not Found"
            $response = "HTTP/1.1 404 Not Found`r`n" +
            "Content-Type: text/plain`r`n" +
            "Content-Length: $($msg.Length)`r`n" +
            "Connection: close`r`n`r`n" +
            $msg
            $responseBytes = [System.Text.Encoding]::UTF8.GetBytes($response)
            $stream.Write($responseBytes, 0, $responseBytes.Length)
        }
        
        $stream.Close()
        $client.Close()
    }
    else {
        Start-Sleep -Milliseconds 100
    }
}
