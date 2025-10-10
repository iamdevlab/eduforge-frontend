import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:8000/", // replace with your backend URL
});

export default apiClient;
