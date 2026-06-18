<?php
// Reenvía /v-api/* y /v-core/* hacia el backend real (apps.procesac.com),
// replicando el comportamiento de api/proxy.js (Vercel) para hosting Apache/PHP.

$backend = 'https://apps.procesac.com';

$mode = $_GET['mode'] ?? 'api';
$path = $_GET['path'] ?? '';

$query = $_GET;
unset($query['mode'], $query['path']);
$queryString = http_build_query($query);

if ($mode === 'core') {
    $targetUrl = $backend . '/' . $path . ($queryString ? '?' . $queryString : '');
} else {
    $targetUrl = $backend . '/api/' . $path . ($queryString ? '?' . $queryString : '');
}

$method = $_SERVER['REQUEST_METHOD'];

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$body = null;
if ($method !== 'GET' && $method !== 'HEAD') {
    $body = file_get_contents('php://input');
}

$headers = [
    'Content-Type: application/json',
    'Origin: https://apps.procesac.com',
    'Referer: https://apps.procesac.com/',
    'Accept: application/json, text/plain, */*',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

$authHeader = null;
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $reqHeaders = apache_request_headers();
    if (isset($reqHeaders['Authorization'])) {
        $authHeader = $reqHeaders['Authorization'];
    }
}
if ($authHeader) {
    $headers[] = 'Authorization: ' . $authHeader;
}

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

if ($body !== null) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Proxy error', 'message' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

$responseBody = substr($response, $headerSize);

http_response_code($statusCode);
if ($contentType) {
    header('Content-Type: ' . $contentType);
}
echo $responseBody;
