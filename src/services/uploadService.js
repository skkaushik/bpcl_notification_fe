import axios from "axios";

export const uploadFileApi = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    "https://sublet-rely-motive.ngrok-free.dev/api/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};