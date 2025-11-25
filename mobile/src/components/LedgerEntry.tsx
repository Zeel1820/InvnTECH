import { Badge } from "./ui/badge";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ArrowRightLeft } from "lucide-react-native";
import { View, Text } from 'react-native';

interface LedgerEntryProps {
  id: string;
  type: "in" | "out" | "adjust" | "transfer";
  quantity: number;
  timestamp: string;
  user: string;
  warehouse?: string;
  reason?: string;
  reference?: string;
}

const typeConfig = {
  in: { 
    label: "Stock In", 
    icon: ArrowDownCircle, 
    className: "text-green-600 dark:text-green-400" 
  },
  out: { 
    label: "Stock Out", 
    icon: ArrowUpCircle, 
    className: "text-red-600 dark:text-red-400" 
  },
  adjust: { 
    label: "Adjustment", 
    icon: RefreshCw, 
    className: "text-orange-600 dark:text-orange-400" 
  },
  transfer: { 
    label: "Transfer", 
    icon: ArrowRightLeft, 
    className: "text-blue-600 dark:text-blue-400" 
  },
};

export default function LedgerEntry({
  id,
  type,
  quantity,
  timestamp,
  user,
  warehouse,
  reason,
  reference,
}: LedgerEntryProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <View className="relative pl-8 pb-4 border-l-2 border-border last:border-l-0" data-testid={`entry-ledger-${id}`}>
      <View className={`absolute left-0 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
      </View>
      
      <View className="bg-card border border-card-border rounded-lg p-3">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs" data-testid={`badge-type-${id}`}>
                {config.label}
              </Badge>
              <Text className="font-mono font-medium" data-testid={`text-quantity-${id}`}>
                {type === "out" || type === "adjust" && quantity < 0 ? "" : "+"}{quantity}
              </Text>
            </View>
            
            <Text className="text-sm text-muted-foreground mt-1">{timestamp}</Text>
            <Text className="text-sm mt-1">By: {user}</Text>
            {warehouse && <Text className="text-sm text-muted-foreground">{warehouse}</Text>}
            {reason && <Text className="text-sm mt-1 italic">Reason: {reason}</Text>}
            {reference && (
              <Text className="text-xs font-mono text-muted-foreground mt-1">
                Ref: {reference}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
