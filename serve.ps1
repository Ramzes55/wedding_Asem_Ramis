param(
  [int]$Port = 5500,
  [switch]$Lan
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$bindAddress = if ($Lan) { [System.Net.IPAddress]::Any } else { [System.Net.IPAddress]::Loopback }
$listener = [System.Net.Sockets.TcpListener]::new($bindAddress, $Port)

function Get-LocalIPv4Address {
  $ipconfigOutput = ipconfig
  $ipv4Line = $ipconfigOutput | Where-Object { $_ -match 'IPv4' } | Select-Object -First 1

  if (-not $ipv4Line) {
    return $null
  }

  $match = [regex]::Match($ipv4Line, '(\d{1,3}\.){3}\d{1,3}')
  if ($match.Success) {
    return $match.Value
  }

  return $null
}

function Get-ContentType {
  param(
    [string]$Path
  )

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    '.html' { return 'text/html; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.js'   { return 'application/javascript; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.svg'  { return 'image/svg+xml' }
    '.ico'  { return 'image/x-icon' }
    '.txt'  { return 'text/plain; charset=utf-8' }
    default { return 'application/octet-stream' }
  }
}

function Resolve-RequestedPath {
  param(
    [string]$RawPath
  )

  $cleanPath = $RawPath.Split('?')[0]
  $relativePath = [System.Uri]::UnescapeDataString($cleanPath.TrimStart('/'))

  if ([string]::IsNullOrWhiteSpace($relativePath)) {
    $relativePath = 'index.html'
  }

  $candidatePath = Join-Path $projectRoot $relativePath

  if ((Test-Path $candidatePath) -and (Get-Item $candidatePath).PSIsContainer) {
    $candidatePath = Join-Path $candidatePath 'index.html'
  }

  return [System.IO.Path]::GetFullPath($candidatePath)
}

function Write-HttpResponse {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType
  )

  $headerLines = @(
    "HTTP/1.1 $StatusCode $StatusText",
    "Content-Type: $ContentType",
    "Content-Length: $($Body.Length)",
    'Cache-Control: no-store, no-cache, must-revalidate',
    'Pragma: no-cache',
    'Expires: 0',
    'Connection: close',
    ''
  )

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes(($headerLines -join "`r`n") + "`r`n")
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

function Read-RequestLine {
  param(
    [System.IO.StreamReader]$Reader
  )

  $requestLine = $Reader.ReadLine()
  if ([string]::IsNullOrWhiteSpace($requestLine)) {
    return $null
  }

  while ($true) {
    $line = $Reader.ReadLine()
    if ($null -eq $line -or $line -eq '') {
      break
    }
  }

  return $requestLine
}

try {
  $listener.Start()
  Write-Host "Local server started: http://localhost:$Port"
  if ($Lan) {
    $localIp = Get-LocalIPv4Address
    if ($localIp) {
      Write-Host "LAN access: http://${localIp}:$Port"
    } else {
      Write-Host 'LAN access enabled, but local IPv4 address was not detected automatically.'
    }
  }
  Write-Host "Project root: $projectRoot"
  Write-Host 'Press Ctrl+C to stop the server.'

  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $client.ReceiveTimeout = 5000
      $client.SendTimeout = 5000
      $stream = $client.GetStream()
      $stream.ReadTimeout = 5000
      $stream.WriteTimeout = 5000
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = Read-RequestLine -Reader $reader

      if (-not $requestLine) {
        continue
      }

      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('400 Bad Request')
        Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -Body $body -ContentType 'text/plain; charset=utf-8'
        continue
      }

      $method = $parts[0]
      $rawPath = $parts[1]

      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        $body = [System.Text.Encoding]::UTF8.GetBytes('405 Method Not Allowed')
        Write-HttpResponse -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -Body $body -ContentType 'text/plain; charset=utf-8'
        continue
      }

      $filePath = Resolve-RequestedPath -RawPath $rawPath

      if (-not $filePath.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $filePath -PathType Leaf)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        Write-HttpResponse -Stream $stream -StatusCode 404 -StatusText 'Not Found' -Body $body -ContentType 'text/plain; charset=utf-8'
        continue
      }

      $fileBytes = if ($method -eq 'HEAD') { [byte[]]::new(0) } else { [System.IO.File]::ReadAllBytes($filePath) }
      $contentType = Get-ContentType -Path $filePath
      Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -Body $fileBytes -ContentType $contentType
    } catch [System.IO.IOException] {
      Write-Host "Request timeout or connection error: $($_.Exception.Message)"
    } catch {
      Write-Host "Request error: $($_.Exception.Message)"
    } finally {
      if ($reader) {
        $reader.Dispose()
      }
      if ($stream) {
        $stream.Dispose()
      }
      $client.Close()
      $reader = $null
      $stream = $null
    }
  }
} finally {
  $listener.Stop()
}
