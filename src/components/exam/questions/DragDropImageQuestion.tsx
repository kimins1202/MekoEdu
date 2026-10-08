import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import COLORS from "../../../constants/colors";
import { DragItem, DropField } from "../../../types/question";
import { getMoodleFileUrl } from "../../../utils/moodleFile";

interface Props {
  image?: string;
  token?: string;
  items: DragItem[];
  fields: DropField[];
  answers: Record<string, string>;
  setAnswer: (field: string, value: string) => void;
}

export default function DragDropImageQuestion({
  image,
  token,
  items,
  fields,
  answers,
  setAnswer,
}: Props) {
  const [selected, setSelected] = useState<DragItem | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

 const imageUrl = useMemo(() => {
   if (!image) return "";

   return getMoodleFileUrl(image, token);
 }, [image, token]);

  return (
    <View>

      {imageUrl && !imageFailed ? (
        <Image
          source={{ uri: imageUrl }}
          resizeMode="contain"
          style={styles.image}
          onError={(event) => {
            console.warn("QUESTION IMAGE ERROR:", event.nativeEvent.error);
            setImageFailed(true);
          }}
        />
      ) : image ? (
        <View style={styles.imageErrorBox}>
          <Text style={styles.imageErrorTitle}>
            Không tải được hình câu hỏi
          </Text>

          <Text style={styles.imageErrorText}>
            Kiểm tra Moodle URL, token Web Service và khả năng điện thoại truy
            cập máy chủ Moodle.
          </Text>
        </View>
      ) : (
        <View style={styles.imageErrorBox}>
          <Text style={styles.imageErrorTitle}>
            Không tìm thấy hình nền trong response Moodle
          </Text>
        </View>
      )}

      <Text style={styles.title}>Nhãn</Text>

      <View style={styles.items}>
        {items.map((item) => {
          const isSelected = selected?.id === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setSelected(item)}
              style={[styles.item, isSelected && styles.selected]}
            >
              <Text
                style={[styles.itemText, isSelected && styles.selectedText]}
              >
                {item.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.title}>Vùng thả</Text>

      {fields.map((field) => {
        const value = answers[field.fieldName];

        const selectedItem = items.find(
          (item) => String(item.choice) === value,
        );

        return (
          <Pressable
            key={field.fieldName}
            style={[styles.drop, selectedItem && styles.dropFilled]}
            onPress={() => {
              if (!selected) return;

              setAnswer(field.fieldName, String(selected.choice));

              setSelected(null);
            }}
          >
            <Text style={styles.dropText}>
              Vùng {field.place}: {selectedItem?.text ?? "Chưa chọn"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 300,
    marginBottom: 16,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
  },

  imageErrorBox: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
    padding: 16,
    justifyContent: "center",
    marginBottom: 16,
  },

  imageErrorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },

  imageErrorText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 10,
  },

  items: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  item: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },

  selected: {
    backgroundColor: COLORS.backgroundSoft,
    borderColor: COLORS.primary,
  },

  itemText: {
    fontSize: 15,
    color: COLORS.text,
  },

  selectedText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  drop: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.textLight,
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },

  dropFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSoft,
  },

  dropText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
});
