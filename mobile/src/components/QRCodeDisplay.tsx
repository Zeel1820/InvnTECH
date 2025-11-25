import QRCode from 'react-native-qrcode-svg';
import { Button } from "./ui/button";
import { Download, Share2 } from "lucide-react-native";
import { View, Text, Share } from 'react-native';

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
    // TODO: Implement native download functionality
    console.log('Download QR code:', value);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `QR Code for ${title}: ${value}`,
      });
    } catch (error) {
      console.error('Error sharing QR code', error);
    }
  };

  return (
    <View className="flex flex-col items-center gap-4 p-6 bg-card border border-card-border rounded-lg">
      <View className="p-4 bg-white rounded-lg">
        <QRCode value={value} size={size} data-testid="qr-code-svg" />
      </View>
      
      {title && (
        <View className="text-center">
          <Text className="font-medium text-base" data-testid="text-qr-title">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-muted-foreground mt-1" data-testid="text-qr-subtitle">{subtitle}</Text>
          )}
        </View>
      )}
      
      {showActions && (
        <View className="flex flex-row gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onPress={handleDownload}
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            <Text>Download</Text>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onPress={handleShare}
            data-testid="button-share-qr"
          >
            <Share2 className="w-4 h-4 mr-2" />
            <Text>Share</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
