import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExamListScreen from "../screens/ExamListScreen";
import QuizScreen from "../screens/QuizScreen";
import { AppStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ExamList"
        component={ExamListScreen}
        options={{ title: "Danh sách bài thi" }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ title: "Làm bài thi" }}
      />
    </Stack.Navigator>
  );
}
