// src/api/authApi.ts
import axiosInstance from "./axiosInstance";

export const loginApi = async (username: string, password: string) => {
  // Gửi trực tiếp qua params của Axios để đảm bảo Moodle đọc đúng username & password
  const response = await axiosInstance.post("/login/token.php", null, {
    params: {
      username: username.trim(),
      password: password.trim(),
      service: "moodle_mobile_app",
    },
  });

  return response.data;
};
