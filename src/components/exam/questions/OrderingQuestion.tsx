import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";

import COLORS from "../../../constants/colors";
import { OrderingItem } from "../../../types/question";

interface Props {
  items: OrderingItem[];
  fieldName: string;
  setAnswer: (field: string, value: string) => void;
}

export default function OrderingQuestion({
  items: initialItems,
  fieldName,
  setAnswer,
}: Props) {
  const [items, setItems] = useState<OrderingItem[]>(() => [...initialItems]);

  const setAnswerRef = useRef(setAnswer);

  useEffect(() => {
    setAnswerRef.current = setAnswer;
  }, [setAnswer]);

  useEffect(() => {
    if (!fieldName) return;

    const value = items.map((item) => item.id).join(",");

    setAnswerRef.current(fieldName, value);
  }, [items, fieldName]);

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<OrderingItem>) => {
    const index = items.findIndex((i) => i.id === item.id);

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={150}
          style={[styles.item, isActive && styles.itemActive]}
        >
          <View style={[styles.numberBox, isActive && styles.numberBoxActive]}>
            <Text style={[styles.number, isActive && styles.numberActive]}>
              {index + 1}
            </Text>
          </View>

          <Text style={[styles.itemText, isActive && styles.itemTextActive]}>
            {item.text}
          </Text>

          <View style={styles.dragHandle}>
            <Ionicons
              name="reorder-two"
              size={26}
              color={isActive ? COLORS.primary : COLORS.textLight}
            />
          </View>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Nhấn giữ và kéo thả để sắp xếp các mục theo thứ tự phù hợp.
      </Text>

      <DraggableFlatList
        data={items}
        onDragEnd={({ data }) => {
          setItems(data);
        }}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
  },

  hint: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  itemActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  numberBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  numberBoxActive: {
    backgroundColor: COLORS.primary,
  },

  number: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },

  numberActive: {
    color: COLORS.white,
  },

  itemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },

  itemTextActive: {
    fontWeight: "600",
  },

  dragHandle: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
});
