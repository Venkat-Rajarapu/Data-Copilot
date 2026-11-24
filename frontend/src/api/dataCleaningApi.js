import axiosClient from "./axiosClient";

// ======================================================
// DATA CLEANING API CONFIGURATION
// ======================================================

const BASE_URL = "/data-cleaning/datasets";

// ======================================================
// 1. MISSING VALUE CLEANING PREVIEW
// ======================================================

export const previewMissingValueCleaning = async (
  datasetId,
  cleaningRequest
) => {
  try {
    const response = await axiosClient.post(
      `${BASE_URL}/${datasetId}/missing-values/preview`,
      cleaningRequest
    );

    return response.data;
  } catch (error) {
    console.error(
      "Missing Value Cleaning Preview Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// 2. APPLY MISSING VALUE CLEANING
// ======================================================

export const applyMissingValueCleaning = async (
  datasetId,
  cleaningRequest
) => {
  try {
    const response = await axiosClient.post(
      `${BASE_URL}/${datasetId}/missing-values/apply`,
      cleaningRequest
    );

    return response.data;
  } catch (error) {
    console.error(
      "Apply Missing Value Cleaning Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// 3. DUPLICATE REMOVAL PREVIEW
// ======================================================

export const previewDuplicateCleaning = async (
  datasetId,
  cleaningRequest
) => {
  try {
    const response = await axiosClient.post(
      `${BASE_URL}/${datasetId}/duplicates/preview`,
      cleaningRequest
    );

    return response.data;
  } catch (error) {
    console.error(
      "Duplicate Cleaning Preview Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// 4. APPLY DUPLICATE REMOVAL
// ======================================================

export const applyDuplicateCleaning = async (
  datasetId,
  cleaningRequest
) => {
  try {
    const response = await axiosClient.post(
      `${BASE_URL}/${datasetId}/duplicates/apply`,
      cleaningRequest
    );

    return response.data;
  } catch (error) {
    console.error(
      "Apply Duplicate Cleaning Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};


// ======================================================
// 5. DEFAULT API EXPORT
// ======================================================

const dataCleaningApi = {
  previewMissingValueCleaning,
  applyMissingValueCleaning,
  previewDuplicateCleaning,
  applyDuplicateCleaning,
};

export default dataCleaningApi;