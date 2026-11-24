import axiosClient from "./axiosClient";

// ==========================================
// 1. GET DATASET VERSIONS
// ==========================================

export const getDatasetVersions = async (datasetId) => {
  const { data } = await axiosClient.get(
    `/dataset-history/datasets/${datasetId}/versions`
  );

  return data;
};

// ==========================================
// 2. GET DATASET AUDIT HISTORY
// ==========================================

export const getDatasetAuditHistory = async (
  datasetId,
  { limit = 50, offset = 0 } = {}
) => {
  const { data } = await axiosClient.get(
    `/dataset-history/datasets/${datasetId}/history`,
    {
      params: {
        limit,
        offset,
      },
    }
  );

  return data;
};

// ==========================================
// 3. RESTORE DATASET VERSION
// ==========================================

export const restoreDatasetVersion = async (
  datasetId,
  versionId
) => {
  const { data } = await axiosClient.post(
    `/dataset-history/datasets/${datasetId}/versions/${versionId}/restore`
  );

  return data;
};

// ==========================================
// 4. EXPORT CURRENT DATASET
// ==========================================

export const exportCurrentDataset = async (
  datasetId,
  format = "csv"
) => {
  const response = await axiosClient.get(
    `/dataset-history/datasets/${datasetId}/export`,
    {
      params: {
        format,
      },
      responseType: "blob",
    }
  );

  return response.data;
};

// ==========================================
// 5. EXPORT HISTORICAL DATASET VERSION
// ==========================================

export const exportDatasetVersion = async (
  datasetId,
  versionId,
  format = "csv"
) => {
  const response = await axiosClient.get(
    `/dataset-history/datasets/${datasetId}/versions/${versionId}/export`,
    {
      params: {
        format,
      },
      responseType: "blob",
    }
  );

  return response.data;
};