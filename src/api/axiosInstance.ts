import axios from "axios";
import { API_CONFIG } from "../constants/config";

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

export default axiosInstance;
