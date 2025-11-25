import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  Package,
} from 'lucide-react-native';
import { View, Text } from 'react-native';

const reportTypes = [
  {
    id: 'current-stock',
    title: 'Current Stock',
    description: 'View stock levels by item and warehouse',
    icon: Package,
  },
  {
    id: 'stock-ledger',
    title: 'Stock Ledger',
    description: 'Detailed transaction history',
    icon: FileText,
  },
  {
    id: 'low-stock',
    title: 'Low Stock Alert',
    description: 'Items below reorder level',
    icon: AlertTriangle,
  },
  {
    id: 'aging-expiry',
    title: 'Aging & Expiry',
    description: 'Items nearing expiration date',
    icon: TrendingUp,
  },
  {
    id: 'utilization',
    title: 'Utilization Report',
    description: 'Serialized item status breakdown',
    icon: BarChart3,
  },
  {
    id: 'transfers',
    title: 'Transfer Audit',
    description: 'Movement between warehouses',
    icon: ArrowRightLeft,
  },
];

export default function Reports() {
  const handleGenerateReport = (reportId: string) => {
    console.log('Generate report:', reportId);
    //todo: remove mock functionality - implement actual report generation
    alert(`Generating ${reportId} report...`);
  };

  const handleExport = () => {
    console.log('Export reports');
    //todo: remove mock functionality - implement export functionality
  };

  return (
    <View className="min-h-screen bg-background pb-16">
      <TopBar title="Reports" onMenuClick={() => console.log('Menu clicked')} />

      <View className="px-4 pt-4 space-y-4">
        {/* Export Button */}
        <Button
          variant="outline"
          className="w-full"
          onPress={handleExport}
          data-testid="button-export-all"
        >
          <Download className="w-4 h-4 mr-2" />
          <Text>Export All Reports</Text>
        </Button>

        {/* Report Types */}
        <View className="space-y-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="hover-elevate cursor-pointer"
                onPress={() => handleGenerateReport(report.id)}
                data-testid={`card-report-${report.id}`}
              >
                <CardHeader className="pb-3">
                  <View className="flex items-start gap-3">
                    <View className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="font-medium text-base">{report.title}</Text>
                      <Text className="text-sm text-muted-foreground mt-1">{report.description}</Text>
                    </View>
                  </View>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onPress={(e: any) => {
                      e.stopPropagation();
                      handleGenerateReport(report.id);
                    }}
                    data-testid={`button-generate-${report.id}`}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    <Text>Generate Report</Text>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </View>
      </View>

      <BottomNav />
    </View>
  );
}
