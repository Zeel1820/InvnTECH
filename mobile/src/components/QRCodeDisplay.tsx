import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui/button";
import { Download, Share2 } from "lucide-react";

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
  const handleDownload = () => {
    console.log('Download QR code:', value);
  };

  const handleShare = () => {
    console.log('Share QR code:', value);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card border border-card-border rounded-lg">
      <div className="p-4 bg-white rounded-lg">
        <QRCodeSVG value={value} size={size} level="H" data-testid="qr-code-svg" />
      </div>
      
      {title && (
        <div className="text-center">
          <h3 className="font-medium text-base" data-testid="text-qr-title">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-qr-subtitle">{subtitle}</p>
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
