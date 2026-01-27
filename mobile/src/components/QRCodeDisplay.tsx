'use client';

import { Button } from './ui/button';
import { Download, Share2 } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  subtitle?: string;
  size?: number;
  showActions?: boolean;
}

export default function QRCodeDisplay({
  value,
  title,
  subtitle,
  size = 200,
  showActions = true,
}: QRCodeDisplayProps) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value
  )}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'qrcode'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code for ${title}`,
          text: `QR Code for ${title}: ${value}`,
          url: qrCodeUrl, // This might not work as expected since it's an image URL
        });
      } catch (error) {
        console.error('Error sharing QR code', error);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      alert('Share functionality is not supported in this browser.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card border rounded-lg">
      <div className="p-4 bg-white rounded-lg">
        <img
          src={qrCodeUrl}
          alt={title || 'QR Code'}
          width={size}
          height={size}
          data-testid="qr-code-svg"
        />
      </div>

      {title && (
        <div className="text-center">
          <p className="font-medium text-lg" data-testid="text-qr-title">
            {title}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-qr-subtitle">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownload}
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleShare}
            data-testid="button-share-qr"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      )}
    </div>
  );
}
