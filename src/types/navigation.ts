export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Launch: undefined;

  Auth: undefined;
  AppInit: undefined;
  App: undefined;
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

  MainTabs: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  History: undefined;
  Settings: undefined;
};
