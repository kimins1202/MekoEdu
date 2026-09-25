import AsyncStorage from "@react-native-async-storage/async-storage";

import axiosInstance from "./axiosInstance";

// Lấy token Moodle
const getToken = async () => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

  return token;
};

// Lấy thông tin user
export const getSiteInfo = async () => {
  const token = await getToken();

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "core_webservice_get_site_info",
        moodlewsrestformat: "json",
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(
      response.data.message || "Không thể lấy thông tin người dùng.",
    );
  }

  return response.data;
};

// Lấy khóa học của user
export const getUserCourses = async (userid: number) => {
  const token = await getToken();

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "core_enrol_get_users_courses",
        moodlewsrestformat: "json",
        userid: Number(userid),
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(
      response.data.message || "Không thể lấy danh sách khóa học.",
    );
  }

  return response.data;
};

// Lấy quiz theo khóa học
export const getQuizzesByCourses = async (courseIds: number[]) => {
  const token = await getToken();

  const params: Record<string, any> = {
    wstoken: token,
    wsfunction: "mod_quiz_get_quizzes_by_courses",
    moodlewsrestformat: "json",
  };

  courseIds.forEach((courseId, index) => {
    params[`courseids[${index}]`] = Number(courseId);
  });

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params,
    },
  );

  if (response.data?.exception) {
    throw new Error(
      response.data.message || "Không thể lấy danh sách bài thi.",
    );
  }

  return response.data;
};

// Kiểm tra quyền truy cập quiz
export const getQuizAccessInformation = async (quizid: number) => {
  const token = await getToken();

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "mod_quiz_get_quiz_access_information",
        moodlewsrestformat: "json",
        quizid: Number(quizid),
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(
      response.data.message || "Không thể kiểm tra quyền truy cập.",
    );
  }

  return response.data;
};

// Lấy lịch sử attempt
export const getUserAttempts = async (
  quizid: number,
  userid: number,
  status: string = "all",
) => {
  const token = await getToken();

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "mod_quiz_get_user_attempts",
        moodlewsrestformat: "json",
        quizid: Number(quizid),
        userid: Number(userid),
        status,
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(response.data.message || "Không thể lấy lịch sử làm bài.");
  }

  return response.data;
};

// Bắt đầu attempt mới
export const startQuizAttempt = async (quizid: number): Promise<number> => {
  const token = await getToken();

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "mod_quiz_start_attempt",
        moodlewsrestformat: "json",
        quizid: Number(quizid),
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(response.data.message || "Không thể bắt đầu bài thi.");
  }

  const attemptId = Number(response.data?.attempt?.id);

  if (!Number.isFinite(attemptId) || attemptId <= 0) {
    throw new Error("API không trả về Attempt ID hợp lệ.");
  }

  return attemptId;
};

// Lấy dữ liệu câu hỏi
export const getAttemptData = async (attemptid: number, page: number = 0) => {
  const token = await getToken();

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "mod_quiz_get_attempt_data",
        moodlewsrestformat: "json",
        attemptid: Number(attemptid),
        page: Number(page),
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(response.data.message || "Không thể lấy dữ liệu bài thi.");
  }

  return response.data;
};

// Lưu câu trả lời
export const saveQuizAttempt = async (attemptid: number, data: any[]) => {
  const token = await getToken();

  const params: Record<string, any> = {
    wstoken: token,
    wsfunction: "mod_quiz_save_attempt",
    moodlewsrestformat: "json",
    attemptid: Number(attemptid),
  };

  data.forEach((item, index) => {
    params[`data[${index}][name]`] = item.name;
    params[`data[${index}][value]`] = item.value;
  });

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params,
    },
  );

  if (response.data?.exception) {
    throw new Error(response.data.message || "Không thể lưu câu trả lời.");
  }

  return response.data;
};

// Moodle resolves time limits, closing time, and user/group overrides.
export const getAttemptDeadline = async (quizid: number, attemptid: number): Promise<number | null> => {
  const token = await getToken();
  const response = await axiosInstance.post("/webservice/rest/server.php", null, {
    params: {
      wstoken: token,
      wsfunction: "mod_quiz_get_attempt_access_information",
      moodlewsrestformat: "json",
      quizid,
      attemptid,
    },
  });
  if (response.data?.exception) throw new Error(response.data.message || "Không thể lấy thời hạn bài thi.");
  const endtime = Number(response.data?.endtime);
  if (!Number.isFinite(endtime) || endtime < 0) throw new Error("Moodle không trả về thời hạn bài thi hợp lệ.");
  return endtime === 0 ? null : endtime * 1000;
};

// Nộp và xử lý bài thi
export const processQuizAttempt = async (
  attemptid: number,
  data: any[] = [],
  finishattempt: number = 1,
) => {
  const token = await getToken();

  const params: Record<string, any> = {
    wstoken: token,
    wsfunction: "mod_quiz_process_attempt",
    moodlewsrestformat: "json",
    attemptid: Number(attemptid),
    finishattempt: Number(finishattempt),
  };

  data.forEach((item, index) => {
    params[`data[${index}][name]`] = item.name;
    params[`data[${index}][value]`] = item.value;
  });

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params,
    },
  );

  if (response.data?.exception) {
    throw new Error(response.data.message || "Không thể nộp bài.");
  }

  return response.data;
};
