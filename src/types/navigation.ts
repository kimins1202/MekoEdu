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

  ExamList: {
    courseid: number;
  };

  ExamDetail: {
    courseid: number;
    quizid: number;
    quizName: string;
    questionCount?: number;
    timelimit?: number;
  };

  Exam: {
    courseid: number;
    quizid: number;
    quizName: string;
    questionCount?: number;
    attemptid?: number;
    submitConfirmed?: boolean;
    targetQuestionSlot?: number;
  };

  ConfirmSubmit: {
    courseid: number;
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

  Result: {
    courseid: number;
    quizid: number;
    quizName: string;
    attemptid: number;
  };

  AnswerReview: {
    attemptid: number;
    quizid: number;
    quizName: string;
  };

  MainTabs: undefined;

  Profile: undefined;

  Contact: undefined;

  Help: undefined;

  Statistics: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  History: undefined;
  Settings: undefined;
};
