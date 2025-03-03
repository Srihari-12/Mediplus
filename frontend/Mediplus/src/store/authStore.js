import { create } from "zustand";
import { login as loginAPI, signup as signupAPI } from "../api/auth";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,

  // ✅ Login function
  login: async (email, password) => {
    try {
      const data = await loginAPI(email, password);
      if (!data.access_token) throw new Error("Invalid credentials");

      // ✅ Store user data (Backend must return name & role)
      const user = { email, name: data.name, role: data.role };
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(user));

      set({ user, token: data.access_token });

    } catch (error) {
      console.error("Authentication failed:", error.message);
      throw error;
    }
  },

  // ✅ Signup function (was previously incomplete)
  signup: async (name, email, password, role) => {
    try {
      const data = await signupAPI(name, email, password, role);
      if (!data.access_token) throw new Error("Signup failed");

      // ✅ Store user data after signup
      const user = { email, name, role };
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(user));

      set({ user, token: data.access_token });

    } catch (error) {
      console.error("Signup failed:", error.message);
      throw error;
    }
  },

  // ✅ Logout function
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
