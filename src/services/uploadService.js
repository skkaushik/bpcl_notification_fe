import axios from "axios";

export const uploadFileApi = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};