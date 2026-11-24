import axiosClient from "./axiosClient";

const BASE_URL = "/data-quality/datasets";

/**
 * Get dataset quality profile
 */
export const getDatasetProfile = async (datasetId) => {
  const response = await axiosClient.get(
    `${BASE_URL}/${datasetId}/profile`
  );
  return response.data;
};

/**
 * Get missing value analysis
 */
export const getMissingValues = async (datasetId) => {
  const response = await axiosClient.get(
    `${BASE_URL}/${datasetId}/missing-values`
  );
  return response.data;
};

/**
 * Get duplicate detection results
 */
export const getDuplicateAnalysis = async (datasetId) => {
  const response = await axiosClient.get(
    `${BASE_URL}/${datasetId}/duplicates`
  );
  return response.data;
};

/**
 * Get data type validation results
 */
export const getDataTypeValidation = async (datasetId) => {
  const response = await axiosClient.get(
    `${BASE_URL}/${datasetId}/validation`
  );
  return response.data;
};

/**
 * Get outlier analysis
 */
export const getOutlierAnalysis = async (
  datasetId,
  method = "iqr"
) => {
  const response = await axiosClient.get(
    `${BASE_URL}/${datasetId}/outliers`,
    {
      params: { method },
    }
  );
  return response.data;
};

/**
 * Get overall data quality score
 */
export const getQualityScore = async (datasetId) => {
  const response = await axiosClient.get(
    `${BASE_URL}/${datasetId}/quality-score`
  );
  return response.data;
};

/**
 * Get complete quality dashboard
 */
export const getQualityDashboard = async (datasetId) => {
  const response = await axiosClient.get(
    `${BASE_URL}/${datasetId}/quality-dashboard`
  );
  return response.data;
};

/**
 * Generate data quality report
 */
export const getQualityReport = async (datasetId) => {
  const response = await axiosClient.get(
    `${BASE_URL}/${datasetId}/quality-report`
  );
  return response.data;
};

const dataQualityApi = {
  getDatasetProfile,
  getMissingValues,
  getDuplicateAnalysis,
  getDataTypeValidation,
  getOutlierAnalysis,
  getQualityScore,
  getQualityDashboard,
  getQualityReport,
};

export default dataQualityApi;