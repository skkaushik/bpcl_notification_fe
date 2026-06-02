import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const sendMailApi = async (mailData) => {
  const response = await axios.post(
    `${API_BASE_URL}/send-mail`,
    mailData
  );

  return response.data;
};