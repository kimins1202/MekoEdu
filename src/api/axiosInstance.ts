import axios from "axios";
import { apiConfig } from "../config";

const axiosInstance = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

export default axiosInstance;
