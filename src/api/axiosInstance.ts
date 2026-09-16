import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.2.169:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

export default axiosInstance;
