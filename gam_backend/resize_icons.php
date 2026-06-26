<?php
$dir = __DIR__ . '/public/img/email-icons/';
$files = ['facebook.png', 'instagram.png', 'x.png', 'telegram.png'];
foreach ($files as $f) {
    $path = $dir . $f;
    $header = bin2hex(fread(fopen($path,'rb'), 4));
    // JPEG starts with ffd8, PNG with 89504e47
    if (strpos($header, 'ffd8') === 0) {
        $src = imagecreatefromjpeg($path);
    } elseif (strpos($header, '89504e47') === 0) {
        $src = imagecreatefrompng($path);
    } else {
        // Try as webp
        $src = imagecreatefromstring(file_get_contents($path));
    }
    $w = imagesx($src);
    $h = imagesy($src);
    $dst = imagecreatetruecolor(40, 40);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefill($dst, 0, 0, $transparent);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, 40, 40, $w, $h);
    imagepng($dst, $path, 9);
    imagedestroy($src);
    imagedestroy($dst);
    echo $f . ': ' . filesize($path) . ' bytes' . PHP_EOL;
}
echo 'Done' . PHP_EOL;

