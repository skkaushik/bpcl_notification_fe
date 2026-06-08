import axios from "axios";

export const askAI = async ({
  sessionId,
  message,
}) => {

  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/chat`,
    {
      session_id: sessionId,
      message,
    }
  );

  return response.data;
};