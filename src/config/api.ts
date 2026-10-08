// API Configuration — đọc từ biến môi trường EXPO_PUBLIC_*
// Xem file .env.example để biết cách cấu hình

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 10000);

if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
  console.warn("[config] EXPO_PUBLIC_API_BASE_URL chưa được cấu hình trong .env");
}

export const apiConfig = {
  BASE_URL,
  TIMEOUT,
} as const;
