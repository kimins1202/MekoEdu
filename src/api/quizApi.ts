import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosInstance";

// =====================================================
// LẤY THÔNG TIN USER
// API: core_webservice_get_site_info
// =====================================================

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

  console.log("SITE INFO API:", response.data);

  return response.data;
};

// =====================================================
// LẤY KHÓA HỌC CỦA USER
// API: core_enrol_get_users_courses
// =====================================================

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

  console.log("USER COURSES API:", response.data);

  return response.data;
};

// =====================================================
// LẤY QUIZ THEO CÁC KHÓA HỌC
// API: mod_quiz_get_quizzes_by_courses
// =====================================================

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

  console.log("QUIZ REQUEST PARAMS:", params);

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: params,
    },
  );

  console.log("QUIZZES API:", response.data);

  return response.data;
};
