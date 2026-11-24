import dataQualityApi from "../../../api/dataQualityApi";

/**
 * Validate dataset ID
 */
const validateDatasetId = (datasetId) => {
  if (
    datasetId === undefined ||
    datasetId === null ||
    String(datasetId).trim() === ""
  ) {
    throw new Error("Please select a valid dataset.");
  }
};

/**
 * Fetch complete quality dashboard
 */
export const fetchQualityDashboard = async (datasetId) => {
  validateDatasetId(datasetId);

  try {
    return await dataQualityApi.getQualityDashboard(datasetId);
  } catch (error) {
    console.error("Quality dashboard error:", error);
    throw error;
  }
};

/**
 * Fetch dataset profile
 */
export const fetchDatasetProfile = async (datasetId) => {
  validateDatasetId(datasetId);
  return await dataQualityApi.getDatasetProfile(datasetId);
};

/**
 * Fetch missing values analysis
 */
export const fetchMissingValues = async (datasetId) => {
  validateDatasetId(datasetId);
  return await dataQualityApi.getMissingValues(datasetId);
};

/**
 * Fetch duplicate analysis
 */
export const fetchDuplicateAnalysis = async (datasetId) => {
  validateDatasetId(datasetId);
  return await dataQualityApi.getDuplicateAnalysis(datasetId);
};

/**
 * Fetch data type validation
 */
export const fetchDataTypeValidation = async (datasetId) => {
  validateDatasetId(datasetId);
  return await dataQualityApi.getDataTypeValidation(datasetId);
};

/**
 * Fetch outlier analysis
 */
export const fetchOutlierAnalysis = async (
  datasetId,
  method = "iqr"
) => {
  validateDatasetId(datasetId);
  return await dataQualityApi.getOutlierAnalysis(datasetId, method);
};

/**
 * Fetch quality score
 */
export const fetchQualityScore = async (datasetId) => {
  validateDatasetId(datasetId);
  return await dataQualityApi.getQualityScore(datasetId);
};

/**
 * Fetch quality report
 */
export const fetchQualityReport = async (datasetId) => {
  validateDatasetId(datasetId);
  return await dataQualityApi.getQualityReport(datasetId);
};

const dataQualityService = {
  fetchQualityDashboard,
  fetchDatasetProfile,
  fetchMissingValues,
  fetchDuplicateAnalysis,
  fetchDataTypeValidation,
  fetchOutlierAnalysis,
  fetchQualityScore,
  fetchQualityReport,
};

export default dataQualityService;