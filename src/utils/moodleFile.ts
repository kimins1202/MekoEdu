export const getMoodleFileUrl = (url?: string, token?: string): string => {
  if (!url) return "";

  let fileUrl = url;

  // Moodle thường trả về /pluginfile.php/
  fileUrl = fileUrl.replace("/pluginfile.php/", "/webservice/pluginfile.php/");

  if (token && !fileUrl.includes("token=")) {
    fileUrl += `${fileUrl.includes("?") ? "&" : "?"}token=${token}`;
  }

  return fileUrl;
};
