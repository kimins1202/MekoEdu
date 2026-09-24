import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "./MainTabNavigator";

import ExamDetailScreen from "../screens/exam/ExamDetailScreen";
import ExamListScreen from "../screens/exam/ExamListScreen";
import ExamScreen from "../screens/exam/ExamScreen";

import { AppStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main application */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Exam flow */}
      <Stack.Screen name="ExamList" component={ExamListScreen} />

      <Stack.Screen name="ExamDetail" component={ExamDetailScreen} />

      <Stack.Screen name="Exam" component={ExamScreen} />
    </Stack.Navigator>
  );
}
