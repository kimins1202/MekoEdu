export const mockCourses = [
  {
    id: 1,
    fullname: "Lập trình Web",
    shortname: "CT449",
  },
  {
    id: 2,
    fullname: "Kiểm thử phần mềm",
    shortname: "CT240",
  },
  {
    id: 3,
    fullname: "Cơ sở dữ liệu",
    shortname: "CT428",
  },
];

export const mockQuizzes = [
  {
    id: 101,
    courseid: 1,
    name: "Kiểm tra giữa kỳ - Lập trình Web",
    intro: "Bài kiểm tra kiến thức HTML, CSS, JavaScript và React.",
    timeLimit: 45,
    timelimit: 45 * 60,
    attempts: 2,
    questionCount: 20,
  },

  {
    id: 102,
    courseid: 2,
    name: "Kiểm tra chương 1 - Kiểm thử phần mềm",
    intro: "Kiểm tra kiến thức cơ bản về Software Testing và ISTQB.",
    timeLimit: 30,
    timelimit: 30 * 60,
    attempts: 3,
    questionCount: 15,
  },

  {
    id: 103,
    courseid: 3,
    name: "Quiz SQL cơ bản",
    intro: "Các câu hỏi về SELECT, JOIN, GROUP BY và truy vấn SQL.",
    timeLimit: 40,
    timelimit: 40 * 60,
    attempts: 1,
    questionCount: 20,
  },
];

export const mockQuizAccess = {
  canAttempt: true,

  preventAccessReasons: [],

  activeRuleNames: [
    "Bạn đã được đăng ký vào khóa học.",
    "Bài thi đang trong thời gian cho phép.",
  ],
};

export const mockAttempts = [
  {
    id: 1,
    attempt: 1,
    state: "Đã hoàn thành",
    timestart: "15/09/2026 08:30",
    timefinish: "15/09/2026 09:05",
    sumgrades: 8.5,
  },

  {
    id: 2,
    attempt: 2,
    state: "Đã hoàn thành",
    timestart: "15/09/2026 14:00",
    timefinish: "15/09/2026 14:32",
    sumgrades: 9.0,
  },
];
