<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

$action = $_GET['action'] ?? '';
$baseDir = __DIR__ . '/app_data';

// Erstelle app_data Ordner, falls er nicht existiert
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0755, true);
}

// 1. Ordnerliste abrufen
if ($action === 'list') {
    $folders = [];
    foreach (scandir($baseDir) as $item) {
        if ($item === '.' || $item === '..') continue;
        if (is_dir($baseDir . '/' . $item)) {
            $folders[] = $item;
        }
    }
    echo json_encode($folders);
    exit;
}

// 2. Upload und Entpacken
if ($action === 'upload') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['error' => 'Nur POST Anfragen erlaubt']);
        exit;
    }
    
    // Passwort check
    $password = $_POST['password'] ?? '';
    if ($password !== 'slopes') {
        echo json_encode(['error' => 'Falsches Passwort']);
        exit;
    }
    
    // Datei check
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['error' => 'Keine Datei hochgeladen oder fehlerhaft']);
        exit;
    }
    
    $file = $_FILES['file'];
    $filename = $file['name'];
    $tmpName = $file['tmp_name'];
    
    // Prüfe auf .slopes Dateiendung
    if (!preg_match('/\.slopes$/i', $filename)) {
        echo json_encode(['error' => 'Nur .slopes Dateien erlaubt']);
        exit;
    }
    
    // Der Ordnername ist der Dateiname ohne .slopes
    $folderName = preg_replace('/\.slopes$/i', '', $filename);
    $targetDir = $baseDir . '/' . $folderName;
    
    if (is_dir($targetDir)) {
        echo json_encode(['error' => 'Dieser Tag / Ordner existiert bereits']);
        exit;
    }
    
    if (!class_exists('ZipArchive')) {
        echo json_encode(['error' => 'Die PHP ZipArchive-Erweiterung fehlt auf deinem Server.']);
        exit;
    }

    $zip = new ZipArchive;
    if ($zip->open($tmpName) === TRUE) {
        mkdir($targetDir, 0755, true);
        $zip->extractTo($targetDir);
        $zip->close();
        
        // Prüfe nach Entpacken ob die Struktur stimmt
        $hasMeta = file_exists($targetDir . '/Metadata.xml');
        $hasGPS = file_exists($targetDir . '/GPS.csv') || file_exists($targetDir . '/rawGPS.csv');
        
        if (!$hasMeta || !$hasGPS) {
            // Rollback: Wenn es keine korrekte Datei ist, Ordner wieder löschen
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($targetDir, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::CHILD_FIRST
            );
            foreach ($files as $fileinfo) {
                $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
                $todo($fileinfo->getRealPath());
            }
            rmdir($targetDir);
            
            echo json_encode(['error' => 'Ungültige .slopes Datei (Metadata.xml oder GPS.csv/rawGPS.csv fehlt)']);
            exit;
        }
        
        echo json_encode(['success' => true, 'folder' => $folderName]);
    } else {
        echo json_encode(['error' => 'Konnte ZIP (.slopes) nicht entpacken']);
    }
    exit;
}

echo json_encode(['error' => 'Ungültige Aktion (nutze ?action=list oder ?action=upload)']);
?>