import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosInstance";

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
