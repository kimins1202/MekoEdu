import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import AppHeader from '../../components/common/AppHeader';
import COLORS from '../../constants/colors';

export default function ResultScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <AppHeader title="Kết quả bài thi" subtitle="Điểm số và đánh giá" showBack />
      <View style={styles.content}>
        <Text style={styles.text}>Tính năng đang phát triển</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate("AnswerReview")}
        >
          <Text style={styles.buttonText}>Xem lại bài làm</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.homeButton]}
          onPress={() => navigation.navigate("MainTabs")}
        >
          <Text style={styles.buttonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: COLORS.textLight,
    fontSize: 16,
    marginBottom: 30,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: COLORS.textSecondary,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
