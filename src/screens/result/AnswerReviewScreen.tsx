import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import AppHeader from '../../components/common/AppHeader';
import COLORS from '../../constants/colors';

export default function AnswerReviewScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Xem lại bài làm" subtitle="Chi tiết các câu hỏi và đáp án" />
      <View style={styles.content}>
        <Text style={styles.text}>Tính năng đang phát triển</Text>
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
  },
});
