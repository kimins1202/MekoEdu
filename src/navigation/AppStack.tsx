import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "./MainTabNavigator";

import ExamDetailScreen from "../screens/exam/ExamDetailScreen";
import ExamListScreen from "../screens/exam/ExamListScreen";
import ExamScreen from "../screens/exam/ExamScreen";

import ProfileScreen from "../screens/account/ProfileScreen";
import CourseDetailScreen from "../screens/course/CourseDetailScreen";
import NotificationScreen from "../screens/notification/NotificationScreen";
import AnswerReviewScreen from "../screens/result/AnswerReviewScreen";
import ResultScreen from "../screens/result/ResultScreen";
import StatisticsScreen from "../screens/result/StatisticsScreen";
import SettingsNotificationScreen from "../screens/settings/NotificationScreen";
import ContactScreen from "../screens/support/ContactScreen";
import HelpScreen from "../screens/support/HelpScreen";

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

      {/* New Screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="SettingsNotification" component={SettingsNotificationScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="AnswerReview" component={AnswerReviewScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
    </Stack.Navigator>
  );
}
