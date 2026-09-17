import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosInstance";

// LẤY THÔNG TIN USER
// API: core_webservice_get_site_info

export const getSiteInfo = async () => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

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

  return response.data;
};

// LẤY KHÓA HỌC CỦA USER
// API: core_enrol_get_users_courses

export const getUserCourses = async (userid: number) => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "core_enrol_get_users_courses",
        moodlewsrestformat: "json",
        userid: userid,
      },
    },
  );

  return response.data;
};

// LẤY QUIZ THEO CÁC KHÓA HỌC
// API: mod_quiz_get_quizzes_by_courses

export const getQuizzesByCourses = async (courseIds: number[]) => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

  const params: any = {
    wstoken: token,
    wsfunction: "mod_quiz_get_quizzes_by_courses",
    moodlewsrestformat: "json",
  };

  // Thêm từng course ID
  courseIds.forEach((courseId, index) => {
    params[`courseids[${index}]`] = courseId;
  });

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: params,
    },
  );

  return response.data;
};
// KIỂM TRA QUYỀN TRUY CẬP QUIZ
// API: mod_quiz_get_quiz_access_information

export const getQuizAccessInformation = async (quizid: number) => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "mod_quiz_get_quiz_access_information",
        moodlewsrestformat: "json",
        quizid: quizid,
      },
    },
  );

  return response.data;
};
// LẤY LỊCH SỬ LÀM QUIZ CỦA USER
// API: mod_quiz_get_user_attempts

export const getUserAttempts = async (
  quizid: number,
  userid: number,
  status: string = "all",
) => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "mod_quiz_get_user_attempts",
        moodlewsrestformat: "json",
        quizid: quizid,
        userid: userid,
        status: status,
      },
    },
  );

  return response.data;
};
// BẮT ĐẦU LÀM QUIZ
// API: mod_quiz_start_attempt

export const startQuizAttempt = async (quizid: number): Promise<number> => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

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
    throw new Error(response.data.message || "Không thể bắt đầu bài thi");
  }

  const attemptId = Number(response.data?.attempt?.id);

  if (!Number.isFinite(attemptId) || attemptId <= 0) {
    throw new Error("API không trả về attempt ID hợp lệ");
  }

  return attemptId;
};

// API 9
// LẤY CÂU HỎI BÀI THI
// mod_quiz_get_attempt_data

export const getAttemptData = async (attemptid: number, page: number = 0) => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,

        wsfunction: "mod_quiz_get_attempt_data",

        moodlewsrestformat: "json",

        attemptid: attemptid,

        page: page,
      },
    },
  );

  return response.data;
};

// API 10
// LƯU CÂU TRẢ LỜI
// mod_quiz_save_attempt

export const saveQuizAttempt = async (attemptid: number, data: any[]) => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

  const params: any = {
    wstoken: token,

    wsfunction: "mod_quiz_save_attempt",

    moodlewsrestformat: "json",

    attemptid: attemptid,
  };

  // Thêm câu trả lời
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

  return response.data;
};
// API 11 - NỘP VÀ XỬ LÝ BÀI THI
// mod_quiz_process_attempt

export const processQuizAttempt = async (
  attemptid: number,
  data: any[] = [],
  finishattempt: number = 1,
) => {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token");
  }

  const params: any = {
    wstoken: token,
    wsfunction: "mod_quiz_process_attempt",
    moodlewsrestformat: "json",

    // Attempt hiện tại
    attemptid: attemptid,

    // 1 = kết thúc/nộp attempt
    finishattempt: finishattempt,
  };

  // DATA

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

  // KIỂM TRA ERROR

  if (response.data?.exception) {
    throw new Error(response.data.message || "Không thể nộp bài");
  }

  return response.data;
};
