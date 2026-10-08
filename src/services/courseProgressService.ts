import { getQuizzesByCourses, getUserAttempts } from "../api/quizApi";

export type CourseExamProgress = {
  totalExams: number;
  completedExams: number;
  progress: number;
  completed: boolean;
};

export const getCourseExamProgress = async (
  courseId: number,
  userId: number,
): Promise<CourseExamProgress> => {
  try {
    // Lấy tất cả quiz trong khóa học
    const quizResponse = await getQuizzesByCourses([Number(courseId)]);

    const quizzes = Array.isArray(quizResponse?.quizzes)
      ? quizResponse.quizzes
      : [];

    const totalExams = quizzes.length;

    // Không có bài thi
    if (totalExams === 0) {
      return {
        totalExams: 0,
        completedExams: 0,
        progress: 0,
        completed: false,
      };
    }

    // Kiểm tra từng quiz đã hoàn thành chưa
    const completionResults = await Promise.all(
      quizzes.map(async (quiz: any) => {
        try {
          const attemptsResponse = await getUserAttempts(
            Number(quiz.id),
            Number(userId),
            "all",
          );

          const attempts = Array.isArray(attemptsResponse?.attempts)
            ? attemptsResponse.attempts
            : [];

          // Chỉ cần có ít nhất 1 attempt finished
          return attempts.some(
            (attempt: any) =>
              String(attempt?.state).toLowerCase() === "finished",
          );
        } catch (error) {
          console.error(`Lỗi kiểm tra trạng thái quiz ${quiz.id}:`, error);

          return false;
        }
      }),
    );

    const completedExams = completionResults.filter(Boolean).length;

    const progress = Math.round((completedExams / totalExams) * 100);

    return {
      totalExams,
      completedExams,
      progress,
      completed: totalExams > 0 && completedExams === totalExams,
    };
  } catch (error) {
    console.error(`Lỗi tính tiến độ course ${courseId}:`, error);

    return {
      totalExams: 0,
      completedExams: 0,
      progress: 0,
      completed: false,
    };
  }
};
