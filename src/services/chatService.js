import axios from "axios";

export const askAI = async ({ sessionId, message }) => {
  const response = await axios.post(
    "https://sublet-rely-motive.ngrok-free.dev/api/chat",
    {
      session_id: sessionId,
      message,
    }
  );

  return response.data;
};