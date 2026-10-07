/**
 * @deprecated Hãy import trực tiếp từ "@/config" thay vì dùng file này.
 * File này chỉ giữ lại để backward compatibility.
 */
import { apiConfig } from "../config";

/** @deprecated Dùng apiConfig từ "@/config" */
export const API_CONFIG = {
  BASE_URL: apiConfig.BASE_URL,
  TIMEOUT: apiConfig.TIMEOUT,
};

export const MOODLE_CONFIG = {
  SERVICE: "moodle_mobile_app",
  REST_ENDPOINT: "/webservice/rest/server.php",
};

export const STORAGE_KEYS = {
  TOKEN: "wstoken",
  USER_ID: "userid",
};
