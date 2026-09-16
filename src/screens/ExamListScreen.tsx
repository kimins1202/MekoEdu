import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Button, StyleSheet, Text, View } from "react-native";

export default function ExamListScreen() {
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    await AsyncStorage.removeItem("wstoken");
    // Reset luồng điều hướng về AuthStack (LoginScreen)
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Màn hình Danh sách bài thi</Text>
      <Button title="Vào thi" onPress={() => navigation.navigate("Quiz")} />
      <View style={{ marginTop: 16 }}>
        <Button title="Đăng xuất" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, marginBottom: 16 },
});
