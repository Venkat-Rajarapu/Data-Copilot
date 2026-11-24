import axiosClient from "./axiosClient";

// ==========================================
// PHASE 6.3 - DATA TYPE CONVERSION PREVIEW
// ==========================================

export const previewDataTypeConversion = async (
  datasetId,
  conversionRequest
) => {
  const { data } = await axiosClient.post(
    `/data-processing/datasets/${datasetId}/type-conversion/preview`,
    conversionRequest
  );

  return data;
};


// ==========================================
// PHASE 6.4 - OUTLIER TREATMENT PREVIEW
// ==========================================

export const previewOutlierTreatment = async (
  datasetId,
  treatmentRequest
) => {
  const { data } = await axiosClient.post(
    `/data-processing/datasets/${datasetId}/outlier-treatment/preview`,
    treatmentRequest
  );

  return data;
};


// ==========================================
// PHASE 6.5 - DATA TRANSFORMATION PREVIEW
// ==========================================

export const previewDataTransformation = async (
  datasetId,
  transformationRequest
) => {
  const { data } = await axiosClient.post(
    `/data-processing/datasets/${datasetId}/transformation/preview`,
    transformationRequest
  );

  return data;
};


// ==========================================
// DEFAULT API EXPORT
// ==========================================

const dataProcessingApi = {
  previewDataTypeConversion,
  previewOutlierTreatment,
  previewDataTransformation,
};

export default dataProcessingApi;