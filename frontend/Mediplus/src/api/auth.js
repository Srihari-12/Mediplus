import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/auth"; // FastAPI backend URL

// ✅ Login API function
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/token`, 
      new URLSearchParams({ username: email, password }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data; // Returns { access_token, token_type, name, role }
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Signup API function (Make sure this exists!)
export const signup = async (name, email, password, role) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, { name, email, password, role });
    return response.data; // Returns { access_token, token_type, name, role }
  } catch (error) {
    console.error("Signup failed:", error.response?.data || error.message);
    throw error;
  }
};
