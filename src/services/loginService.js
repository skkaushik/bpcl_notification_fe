import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const loginApi = async (email, password) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login`,
    {
      email,
      password,
    }
  );

  return response.data;
};