const axios = require("axios");
const config = require("../../config/config");
const apiKey = config.key.apiKey;

// Fetcher for Airtable API
const fetcher = axios.create({});
fetcher.interceptors.request.use(
  (config) => {
    config.headers = {
      Authorization: `Bearer ${apiKey}`,
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

module.exports = fetcher;