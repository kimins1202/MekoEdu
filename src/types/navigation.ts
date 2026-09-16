export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  ExamList: undefined;

  Quiz: {
    quizid: number;
    quizName: string;
  };

  TakeQuiz: {
    quizid: number;
    quizName: string;
  };
};
