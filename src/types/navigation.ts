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

  CourseDetail: undefined;

  Notifications: undefined;

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
    questionCount?: number;
    attemptid?: number;
    submitConfirmed?: boolean;
    targetQuestionSlot?: number;
  };

  ConfirmSubmit: {
    quizid: number;
    quizName: string;
    attemptid: number;
    questions: {
      id: number;
      number: number;
      status: "answered" | "unanswered";
      flagged?: boolean;
      saveStatus?: "saved" | "saving" | "not_saved";
    }[];
  };

  MainTabs: undefined;

  Profile: undefined;

  Notification: undefined;

  SettingsNotification: undefined;

  Contact: undefined;

  Help: undefined;

  Result: undefined;

  AnswerReview: undefined;

  Statistics: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  History: undefined;
  Settings: undefined;
};
