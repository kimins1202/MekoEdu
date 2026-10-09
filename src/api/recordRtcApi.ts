import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "./axiosInstance";

export interface UploadedRecording {
  itemid: number;
  filename: string;
  filesize: number;
}

export async function uploadRecording(
  audioUri: string,
): Promise<UploadedRecording> {
  const token = await AsyncStorage.getItem("wstoken");

  if (!token) {
    throw new Error("Không tìm thấy token Moodle.");
  }

  const formData = new FormData();

  formData.append("file_1", {
    uri: audioUri,
    name: "recording.m4a",
    type: "audio/mp4",
  } as any);

  formData.append("filepath", "/");

  const response = await axiosInstance.post(
    "/webservice/upload.php",
    formData,
    {
      params: { token },
      headers: {
        "Content-Type": undefined,
        Accept: "application/json",
      },
      timeout: 120000,
    },
  );

  const result = response.data;

  if (result?.exception) {
    throw new Error(result.message ?? "Upload thất bại.");
  }

  if (!Array.isArray(result) || !result[0]?.itemid) {
    throw new Error("Moodle không trả về itemid hợp lệ.");
  }

  return {
    itemid: Number(result[0].itemid),
    filename: result[0].filename,
    filesize: Number(result[0].filesize),
  };
}
