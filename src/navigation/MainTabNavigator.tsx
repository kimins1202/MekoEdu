import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CourseListScreen from "../screens/course/CourseListScreen";
import HomeScreen from "../screens/home/HomeScreen";
import HistoryScreen from "../screens/result/HistoryScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";

import COLORS from "../constants/colors";
import { MainTabParamList } from "../types/navigation";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: COLORS.primaryDark,
        tabBarInactiveTintColor: COLORS.textLight,

        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,

          backgroundColor: COLORS.white,

          borderTopWidth: 1,
          borderTopColor: COLORS.border,

          elevation: 10,

          shadowColor: COLORS.black,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 2,
        },
      }}
    >
      {/* Trang chủ */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Trang chủ",

          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={focused ? 24 : 23}
              color={color}
            />
          ),
        }}
      />

      {/* Khóa học */}
      <Tab.Screen
        name="Courses"
        component={CourseListScreen}
        options={{
          tabBarLabel: "Khóa học",

          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={focused ? 24 : 23}
              color={color}
            />
          ),
        }}
      />

      {/* Lịch sử */}
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: "Lịch sử",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={focused ? 24 : 23}
              color={color}
            />
          ),
        }}
      />

      {/* Cài đặt */}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Cài đặt",

          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={focused ? 24 : 23}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
