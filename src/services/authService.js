import api from "./api";

export const register = async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
};

export const login = async (data) => {
    const response = await api.post("/auth/login", data);
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};

// Google Workspace sign-in: idToken comes from Google Identity Services, campus from the picker
export const loginWithGoogle = async (data) => {
    const response = await api.post("/auth/google", data);
    return response.data;
};

// { enabled, clientId } - the Google button is shown only when enabled
export const getGoogleConfig = async () => {
    const response = await api.get("/auth/google/config");
    return response.data;
};

export const getCampuses = async () => {
    const response = await api.get("/auth/campuses");
    return response.data;
};
