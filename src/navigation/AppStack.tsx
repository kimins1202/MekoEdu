import ExamScreen from "@/screens/ExamScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CourseListScreen from "../screens/CourseListScreen";
import { default as ExamDetailScreen } from "../screens/ExamDetailScreen";
import ExamListScreen from "../screens/ExamListScreen";
import { AppStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CourseList"
        component={CourseListScreen}
        options={{ title: "Khóa học" }}
      />
      <Stack.Screen
        name="ExamList"
        component={ExamListScreen}
        options={{ title: "Danh sách bài thi" }}
      />
      <Stack.Screen
        name="ExamDetail"
        component={ExamDetailScreen}
        options={{ title: "Chi tiết bài thi" }}
      />
      <Stack.Screen name="Exam" component={ExamScreen} />
    </Stack.Navigator>
  );
}
