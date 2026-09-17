export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  AppInit: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  CourseList: undefined;

  ExamList: {
    courseid: number;
  };

  ExamDetail: {
    quizid: number;
    quizName: string;
    questionCount?: number;
    timelimit?: number;
  };

  Exam: {
    quizid: number;
    quizName: string;
  };
};
