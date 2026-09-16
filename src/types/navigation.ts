export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  ExamList: undefined;
  Quiz: { quizId?: string };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
