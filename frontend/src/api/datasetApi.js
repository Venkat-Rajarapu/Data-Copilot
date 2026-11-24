import axiosClient from "./axiosClient";

// ==========================================
// 1. UPLOAD DATASET
// ==========================================

export const uploadDataset = async (name, file, ownerId = null) => {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("file", file);

  if (ownerId !== null && ownerId !== undefined) {
    formData.append("owner_id", String(ownerId));
  }

  const { data } = await axiosClient.post(
    "/datasets/upload",
    formData
  );

  return data;
};

// ==========================================
// 2. GET ALL DATASETS
// ==========================================

export const getDatasets = async () => {
  const { data } = await axiosClient.get("/datasets/");
  return data;
};

// ==========================================
// 3. GET DATASET BY ID
// ==========================================

export const getDatasetById = async (datasetId) => {
  const { data } = await axiosClient.get(
    `/datasets/${datasetId}`
  );

  return data;
};

// ==========================================
// 4. GET DATASETS BY OWNER
// ==========================================

export const getDatasetsByOwner = async (ownerId) => {
  const { data } = await axiosClient.get(
    `/datasets/owner/${ownerId}`
  );

  return data;
};

// ==========================================
// 5. PREVIEW DATASET
// ==========================================

export const getDatasetPreview = async (
  datasetId,
  { limit = 10, offset = 0, search = "" } = {}
) => {
  const { data } = await axiosClient.get(
    `/datasets/${datasetId}/preview`,
    {
      params: {
        limit,
        offset,
        ...(search ? { search } : {}),
      },
    }
  );

  return data;
};

// ==========================================
// 6. UPDATE DATASET
// ==========================================

export const updateDataset = async (datasetId, datasetData) => {
  const { data } = await axiosClient.put(
    `/datasets/${datasetId}`,
    datasetData
  );

  return data;
};

// ==========================================
// 7. DELETE DATASET
// ==========================================

export const deleteDataset = async (datasetId) => {
  await axiosClient.delete(`/datasets/${datasetId}`);
  return true;
};