import axios from "axios";

const BASE_URL = "https://dummyjson.com/"

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers:{
        'Content-Type' : 'application/json',
    },
});

apiClient.interceptors.request.use(
    async(config) =>{
        return config;
    },
    (error) => Promise.reject(error)
);