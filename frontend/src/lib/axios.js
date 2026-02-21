import axios from "axios";

const serverIP = window.location.hostname;

export const axiosInstance = axios.create({
  baseURL: `http://${serverIP}:5001/api`, 
  withCredentials: true,
});