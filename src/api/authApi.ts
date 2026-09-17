import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosInstance";

// =========================
// 1. LOGIN
// =========================

export const loginApi = async (username: string, password: string) => {
  const response = await axiosInstance.post("/login/token.php", null, {
    params: {
      username: username.trim(),
      password: password.trim(),
      service: "moodle_mobile_app",
    },
  });

  return response.data;
};

// =========================
// 2. LẤY THÔNG TIN USER
// =========================

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

  if (response.data?.exception) {
    throw new Error(
      response.data.message || "Không thể lấy thông tin tài khoản",
    );
  }

  return response.data;
};
