import axios from "axios";

export const sendEmailsApi = async (payload) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/email/send`,
    payload
  );

  return response.data;
};
