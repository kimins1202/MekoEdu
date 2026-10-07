import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosInstance";
import type { CourseSection } from "@/types/course";

export const getCourseContents = async (
  courseid: number,
): Promise<CourseSection[]> => {
  const token = await AsyncStorage.getItem("wstoken");
  if (!token) throw new Error("Không tìm thấy token");

  const response = await axiosInstance.post(
    "/webservice/rest/server.php",
    null,
    {
      params: {
        wstoken: token,
        wsfunction: "core_course_get_contents",
        moodlewsrestformat: "json",
        courseid: Number(courseid),
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(response.data.message || "Không thể lấy các phần của khóa học");
  }
  if (!Array.isArray(response.data)) {
    throw new Error("Dữ liệu các phần của khóa học không hợp lệ");
  }
  return response.data;
};

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
        userid,
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(
      response.data.message || "Không thể lấy danh sách khóa học",
    );
  }

  return response.data;
};

export const getCourseCompletionStatus = async (
  courseid: number,
  userid: number,
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
        wsfunction: "core_completion_get_course_completion_status",
        moodlewsrestformat: "json",
        courseid,
        userid,
      },
    },
  );

  if (response.data?.exception) {
    throw new Error(response.data.message || "Không thể lấy tiến độ khóa học");
  }

  return response.data;
};
