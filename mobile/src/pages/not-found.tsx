import { Card, CardContent } from '../components/ui/card';
import { AlertCircle } from 'lucide-react-native';
import { View, Text } from 'react-native';

export default function NotFound() {
  return (
    <View className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <View className="flex flex-row items-center mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <Text className="text-2xl font-bold text-gray-900">404 Page Not Found</Text>
          </View>

          <Text className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </Text>
        </CardContent>
      </Card>
    </View>
  );
}
