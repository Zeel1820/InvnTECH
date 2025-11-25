import { Search, X } from "lucide-react-native";
import { TextInput, View, Pressable } from "react-native";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
}

export default function SearchBar({
  placeholder = "Search inventory...",
  onSearch,
  onClear,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch?.(""); // Notify parent that search is cleared
    onClear?.();
  };

  return (
    <View className="relative justify-center">
      <View className="absolute left-3 z-10">
        <Search className="w-5 h-5 text-muted-foreground" />
      </View>
      <TextInput
        placeholder={placeholder}
        value={query}
        onChangeText={handleChange}
        className="pl-10 pr-10 h-12 bg-input rounded-lg border border-border text-foreground"
        placeholderTextColor="#a1a1aa"
        data-testid="input-search"
      />
      {query ? (
        <Pressable
          className="absolute right-1 h-full w-10 flex items-center justify-center"
          onPress={handleClear}
          data-testid="button-clear-search"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}
