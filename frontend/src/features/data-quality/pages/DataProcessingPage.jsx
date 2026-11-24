import { useEffect, useMemo, useState } from "react";

import {
  getDatasets,
  getDatasetPreview,
} from "../../../api/datasetApi";

import {
  previewDataTypeConversion,
  previewOutlierTreatment,
  previewDataTransformation,
} from "../../../api/dataProcessingApi";

// ==========================================
// CONFIGURATION
// ==========================================

const TARGET_TYPES = [
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float / Decimal" },
  { value: "string", label: "String / Text" },
  { value: "datetime", label: "Date & Time" },
  { value: "boolean", label: "Boolean (True / False)" },
];

const OUTLIER_METHODS = [
  { value: "iqr", label: "IQR Method" },
  { value: "zscore", label: "Z-Score Method" },
];

const OUTLIER_TREATMENTS = [
  { value: "cap", label: "Capping" },
  { value: "median", label: "Median Replacement" },
  { value: "remove", label: "Remove Rows" },
];

const TRANSFORMATIONS = [
  {
    value: "normalize",
    label: "Normalization",
    description: "Scales numerical values between 0 and 1 using Min-Max scaling.",
    numeric: true,
  },
  {
    value: "standardize",
    label: "Standardization",
    description: "Transforms numerical values using mean and standard deviation.",
    numeric: true,
  },
  {
    value: "label_encode",
    label: "Label Encoding",
    description: "Converts categorical values into integer labels.",
    numeric: false,
  },
  {
    value: "one_hot_encode",
    label: "One-Hot Encoding",
    description: "Creates separate binary columns for categorical values.",
    numeric: false,
  },
  {
    value: "rename",
    label: "Column Renaming",
    description: "Changes the name of an existing column.",
    numeric: false,
  },
];


// ==========================================
// HELPER FUNCTIONS
// ==========================================

const getDatasetList = (response) => {
  if (Array.isArray(response)) return response;

  return (
    response?.datasets ??
    response?.data?.datasets ??
    response?.data ??
    []
  );
};

const getPreviewRows = (response) => {
  if (Array.isArray(response)) return response;

  return (
    response?.rows ??
    response?.preview ??
    response?.records ??
    response?.data?.rows ??
    response?.data?.preview ??
    response?.data?.records ??
    []
  );
};

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (detail?.message) return detail.message;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return error?.message || "Something went wrong. Please try again.";
};

const formatValue = (value) => {
  if (value === null || value === undefined) return "NULL";

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const getLikelyNumericColumns = (rows, columnNames) => {
  const identifierKeywords = [
    "id",
    "code",
    "phone",
    "mobile",
    "postal",
    "zip",
    "regd",
    "registration",
  ];

  return columnNames.filter((column) => {
    const normalizedName = column.toLowerCase();

    if (
      identifierKeywords.some((keyword) =>
        normalizedName.includes(keyword)
      )
    ) {
      return false;
    }

    const values = rows
      .map((row) => row[column])
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
      );

    if (values.length === 0) return false;

    const numericCount = values.filter((value) => {
      if (typeof value === "boolean") return false;

      const normalized = String(value)
        .replace(/,/g, "")
        .trim();

      return normalized !== "" && Number.isFinite(Number(normalized));
    }).length;

    return numericCount / values.length >= 0.8;
  });
};


// ==========================================
// COMPONENT
// ==========================================

const DataProcessingPage = () => {

  // ----------------------------------------
  // MAIN STATE
  // ----------------------------------------

  const [activeOperation, setActiveOperation] = useState("conversion");

  const [datasets, setDatasets] = useState([]);

  const [selectedDatasetId, setSelectedDatasetId] = useState("");

  const [columns, setColumns] = useState([]);

  const [numericColumns, setNumericColumns] = useState([]);

  const [selectedColumns, setSelectedColumns] = useState([]);

  const [previewLimit, setPreviewLimit] = useState(20);

  const [result, setResult] = useState(null);


  // ----------------------------------------
  // CONVERSION STATE
  // ----------------------------------------

  const [targetType, setTargetType] = useState("integer");


  // ----------------------------------------
  // OUTLIER STATE
  // ----------------------------------------

  const [outlierMethod, setOutlierMethod] = useState("iqr");

  const [outlierTreatment, setOutlierTreatment] = useState("cap");


  // ----------------------------------------
  // DATA TRANSFORMATION STATE
  // ----------------------------------------

  const [transformationType, setTransformationType] =
    useState("normalize");

  const [newColumnName, setNewColumnName] = useState("");


  // ----------------------------------------
  // LOADING AND ERROR STATE
  // ----------------------------------------

  const [loadingDatasets, setLoadingDatasets] = useState(true);

  const [loadingColumns, setLoadingColumns] = useState(false);

  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");


  // ========================================
  // LOAD DATASETS
  // ========================================

  useEffect(() => {

    const loadDatasets = async () => {

      try {

        setLoadingDatasets(true);

        const response = await getDatasets();

        const datasetList = getDatasetList(response);

        setDatasets(datasetList);

        if (datasetList.length > 0) {
          setSelectedDatasetId(String(datasetList[0].id));
        }

      } catch (err) {

        setError(getErrorMessage(err));

      } finally {

        setLoadingDatasets(false);

      }

    };

    loadDatasets();

  }, []);


  // ========================================
  // LOAD DATASET COLUMNS
  // ========================================

  useEffect(() => {

    if (!selectedDatasetId) {

      setColumns([]);

      setNumericColumns([]);

      setSelectedColumns([]);

      setResult(null);

      return;

    }

    const loadColumns = async () => {

      try {

        setLoadingColumns(true);

        setError("");

        setResult(null);

        setSelectedColumns([]);

        const response = await getDatasetPreview(
          selectedDatasetId,
          {
            limit: 100,
            offset: 0,
          }
        );

        const rows = getPreviewRows(response);

        let columnNames =
          response?.columns ??
          response?.data?.columns ??
          [];

        if (
          !Array.isArray(columnNames) ||
          columnNames.length === 0
        ) {

          if (rows.length > 0) {
            columnNames = Object.keys(rows[0]);
          }

        }

        setColumns(columnNames);

        setNumericColumns(
          getLikelyNumericColumns(rows, columnNames)
        );

      } catch (err) {

        setError(getErrorMessage(err));

        setColumns([]);

        setNumericColumns([]);

      } finally {

        setLoadingColumns(false);

      }

    };

    loadColumns();

  }, [selectedDatasetId]);


  // ========================================
  // SELECTED DATASET
  // ========================================

  const selectedDataset = useMemo(
    () =>
      datasets.find(
        (dataset) =>
          String(dataset.id) === String(selectedDatasetId)
      ),
    [datasets, selectedDatasetId]
  );


  // ========================================
  // SELECTED TRANSFORMATION
  // ========================================

  const selectedTransformation = TRANSFORMATIONS.find(
    (item) => item.value === transformationType
  );


  // ========================================
  // AVAILABLE COLUMNS
  // ========================================

  const availableColumns =
    activeOperation === "outlier" ||
    (
      activeOperation === "transformation" &&
      selectedTransformation?.numeric
    )
      ? numericColumns
      : columns;


  // ========================================
  // OPERATION SWITCHING
  // ========================================

  const handleOperationChange = (operation) => {

    setActiveOperation(operation);

    setSelectedColumns([]);

    setResult(null);

    setError("");

  };


  // ========================================
  // COLUMN SELECTION
  // ========================================

  const toggleColumn = (column) => {

    setSelectedColumns((previous) =>
      previous.includes(column)
        ? previous.filter((item) => item !== column)
        : [...previous, column]
    );

    setResult(null);

    setError("");

  };


  const selectAllColumns = () => {

    setSelectedColumns(availableColumns);

    setResult(null);

    setError("");

  };


  const clearColumns = () => {

    setSelectedColumns([]);

    setResult(null);

    setError("");

  };


  // ========================================
  // DATA TYPE CONVERSION
  // ========================================

  const handlePreviewConversion = async () => {

    if (!selectedDatasetId) {
      setError("Please select a dataset.");
      return;
    }

    if (selectedColumns.length === 0) {
      setError("Please select at least one column.");
      return;
    }

    try {

      setProcessing(true);

      setError("");

      setResult(null);

      const response = await previewDataTypeConversion(
        selectedDatasetId,
        {
          columns: selectedColumns,
          target_type: targetType,
          preview_limit: previewLimit,
        }
      );

      setResult(response);

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setProcessing(false);

    }

  };


  // ========================================
  // OUTLIER TREATMENT
  // ========================================

  const handlePreviewOutlierTreatment = async () => {

    if (!selectedDatasetId) {
      setError("Please select a dataset.");
      return;
    }

    if (selectedColumns.length === 0) {
      setError("Please select at least one numeric column.");
      return;
    }

    try {

      setProcessing(true);

      setError("");

      setResult(null);

      const response = await previewOutlierTreatment(
        selectedDatasetId,
        {
          columns: selectedColumns,
          method: outlierMethod,
          treatment: outlierTreatment,
          preview_limit: previewLimit,
        }
      );

      setResult(response);

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setProcessing(false);

    }

  };


  // ========================================
  // DATA TRANSFORMATION
  // ========================================

  const handlePreviewTransformation = async () => {

    if (!selectedDatasetId) {
      setError("Please select a dataset.");
      return;
    }

    if (selectedColumns.length === 0) {
      setError("Please select at least one column.");
      return;
    }

    if (
      transformationType === "rename" &&
      !newColumnName.trim()
    ) {
      setError("Please enter a new column name.");
      return;
    }

    if (
      transformationType === "rename" &&
      selectedColumns.length !== 1
    ) {
      setError("Please select exactly one column for renaming.");
      return;
    }

    try {

      setProcessing(true);

      setError("");

      setResult(null);

      const request = {
        operation: transformationType,
        columns: selectedColumns,
        preview_limit: previewLimit,
      };

      if (transformationType === "rename") {
        request.new_name = newColumnName.trim();
      }

      const response = await previewDataTransformation(
        selectedDatasetId,
        request
      );

      setResult(response);

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setProcessing(false);

    }

  };


  // ========================================
  // CONVERSION STATISTICS
  // ========================================

  const conversionSummary =
    result?.conversion_summary ?? [];

  const totalConverted = conversionSummary.reduce(
    (total, item) =>
      total + (Number(item.converted_values) || 0),
    0
  );

  const totalInvalid = conversionSummary.reduce(
    (total, item) =>
      total + (Number(item.invalid_values) || 0),
    0
  );


  // ========================================
  // OUTLIER STATISTICS
  // ========================================

  const treatmentSummary =
    result?.treatment_summary ?? {};

  const outlierColumnSummary =
    treatmentSummary.column_summary ?? [];


  // ========================================
  // TRANSFORMATION STATISTICS
  // ========================================

  const transformationSummary =
    result?.transformation_summary ?? [];


  // ========================================
  // PREVIEW TABLE
  // ========================================

  const renderTable = (rows, title) => {

    if (!rows || rows.length === 0) {

      return (
        <div style={styles.emptyPreview}>
          No preview records available.
        </div>
      );

    }

    const headers = Object.keys(rows[0]);

    return (

      <div style={styles.previewSection}>

        <h3 style={styles.sectionTitle}>
          {title}
        </h3>

        <div style={styles.tableWrapper}>

          <table style={styles.table}>

            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header} style={styles.th}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>

              {rows.map((row, index) => (

                <tr key={index}>

                  {headers.map((header) => (

                    <td key={header} style={styles.td}>
                      {formatValue(row[header])}
                    </td>

                  ))}

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    );

  };


  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loadingDatasets) {

    return (
      <div style={styles.page}>
        Loading datasets...
      </div>
    );

  }


  // ========================================
  // MAIN UI
  // ========================================

  return (

    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            Data Processing
          </h1>

          <p style={styles.subtitle}>
            Convert data types, handle outliers, and transform
            dataset columns with preview-based processing.
          </p>

        </div>

      </div>


      {/* OPERATION TABS */}

      <section style={styles.card}>

        <h2 style={styles.sectionTitle}>
          Processing Operations
        </h2>

        <div style={styles.tabs}>

          <button
            onClick={() => handleOperationChange("conversion")}
            style={{
              ...styles.tabButton,
              ...(activeOperation === "conversion"
                ? styles.activeTab
                : {}),
            }}
          >
            Data Type Conversion
          </button>

          <button
            onClick={() => handleOperationChange("outlier")}
            style={{
              ...styles.tabButton,
              ...(activeOperation === "outlier"
                ? styles.activeTab
                : {}),
            }}
          >
            Outlier Treatment
          </button>

          <button
            onClick={() => handleOperationChange("transformation")}
            style={{
              ...styles.tabButton,
              ...(activeOperation === "transformation"
                ? styles.activeTab
                : {}),
            }}
          >
            Data Transformation
          </button>

        </div>

      </section>


      {/* DATASET SELECTION */}

      <section style={styles.card}>

        <h2 style={styles.sectionTitle}>
          1. Select Dataset
        </h2>

        {datasets.length === 0 ? (

          <p style={styles.muted}>
            No datasets found. Upload a dataset to get started.
          </p>

        ) : (

          <>

            <label style={styles.label}>
              Choose Dataset
            </label>

            <select
              value={selectedDatasetId}
              onChange={(event) =>
                setSelectedDatasetId(event.target.value)
              }
              style={styles.select}
            >

              {datasets.map((dataset) => (

                <option
                  key={dataset.id}
                  value={dataset.id}
                >
                  {dataset.name ||
                    dataset.original_filename ||
                    dataset.id}
                </option>

              ))}

            </select>

            {selectedDataset && (

              <div style={styles.datasetInfo}>

                <span>
                  <strong>Dataset:</strong>{" "}
                  {selectedDataset.name ||
                    selectedDataset.original_filename}
                </span>

                <span>
                  <strong>File type:</strong>{" "}
                  {selectedDataset.file_type || "N/A"}
                </span>

              </div>

            )}

          </>

        )}

      </section>


      {/* COLUMN SELECTION */}

      <section style={styles.card}>

        <div style={styles.sectionHeader}>

          <h2 style={styles.sectionTitle}>
            2. Select Columns
          </h2>

          <div style={styles.actionButtons}>

            <button
              onClick={selectAllColumns}
              style={styles.textButton}
              disabled={availableColumns.length === 0}
            >
              Select All
            </button>

            <button
              onClick={clearColumns}
              style={styles.textButton}
            >
              Clear
            </button>

          </div>

        </div>


        {loadingColumns ? (

          <p style={styles.muted}>
            Loading columns...
          </p>

        ) : availableColumns.length === 0 ? (

          <p style={styles.muted}>
            {activeOperation === "outlier" ||
            (
              activeOperation === "transformation" &&
              selectedTransformation?.numeric
            )
              ? "No numeric columns were identified in the dataset preview."
              : "No columns available for this dataset."}
          </p>

        ) : (

          <div style={styles.columnGrid}>

            {availableColumns.map((column) => (

              <label
                key={column}
                style={{
                  ...styles.checkboxLabel,
                  borderColor: selectedColumns.includes(column)
                    ? "#6366f1"
                    : "var(--color-border)",
                }}
              >

                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column)}
                  onChange={() => toggleColumn(column)}
                />

                <span>{column}</span>

              </label>

            ))}

          </div>

        )}


        <p style={styles.muted}>
          {selectedColumns.length} of{" "}
          {availableColumns.length} columns selected
        </p>


        {activeOperation === "outlier" && (

          <div style={styles.infoBox}>
            Only likely numeric columns are displayed.
            The backend performs final numeric validation.
          </div>

        )}

        {activeOperation === "transformation" && (

          <div style={styles.infoBox}>
            {selectedTransformation?.numeric
              ? "Only likely numeric columns are displayed for this transformation."
              : "Select one or more categorical or other columns for this transformation. The backend performs final validation."}
          </div>

        )}

      </section>


      {/* CONVERSION SETTINGS */}

      {activeOperation === "conversion" && (

        <section style={styles.card}>

          <h2 style={styles.sectionTitle}>
            3. Conversion Settings
          </h2>

          <div style={styles.settingsGrid}>

            <div>

              <label style={styles.label}>
                Target Data Type
              </label>

              <select
                value={targetType}
                onChange={(event) => {
                  setTargetType(event.target.value);
                  setResult(null);
                }}
                style={styles.select}
              >

                {TARGET_TYPES.map((type) => (

                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>

                ))}

              </select>

            </div>


            <div>

              <label style={styles.label}>
                Preview Limit
              </label>

              <select
                value={previewLimit}
                onChange={(event) =>
                  setPreviewLimit(Number(event.target.value))
                }
                style={styles.select}
              >

                {[10, 20, 50, 100].map((limit) => (

                  <option key={limit} value={limit}>
                    {limit} Records
                  </option>

                ))}

              </select>

            </div>

          </div>


          <div style={styles.warning}>
            <strong>Important:</strong> Invalid values may become NULL
            during conversion. Review the conversion summary before
            applying changes.
          </div>


          <button
            onClick={handlePreviewConversion}
            disabled={
              processing ||
              loadingColumns ||
              selectedColumns.length === 0
            }
            style={styles.primaryButton}
          >

            {processing
              ? "Generating Preview..."
              : "Preview Conversion"}

          </button>

        </section>

      )}


      {/* OUTLIER SETTINGS */}

      {activeOperation === "outlier" && (

        <section style={styles.card}>

          <h2 style={styles.sectionTitle}>
            3. Outlier Treatment Settings
          </h2>


          <div style={styles.settingsGrid}>

            <div>

              <label style={styles.label}>
                Detection Method
              </label>

              <select
                value={outlierMethod}
                onChange={(event) => {
                  setOutlierMethod(event.target.value);
                  setResult(null);
                }}
                style={styles.select}
              >

                {OUTLIER_METHODS.map((method) => (

                  <option
                    key={method.value}
                    value={method.value}
                  >
                    {method.label}
                  </option>

                ))}

              </select>

            </div>


            <div>

              <label style={styles.label}>
                Treatment Strategy
              </label>

              <select
                value={outlierTreatment}
                onChange={(event) => {
                  setOutlierTreatment(event.target.value);
                  setResult(null);
                }}
                style={styles.select}
              >

                {OUTLIER_TREATMENTS.map((treatment) => (

                  <option
                    key={treatment.value}
                    value={treatment.value}
                  >
                    {treatment.label}
                  </option>

                ))}

              </select>

            </div>


            <div>

              <label style={styles.label}>
                Preview Limit
              </label>

              <select
                value={previewLimit}
                onChange={(event) =>
                  setPreviewLimit(Number(event.target.value))
                }
                style={styles.select}
              >

                {[10, 20, 50, 100].map((limit) => (

                  <option key={limit} value={limit}>
                    {limit} Records
                  </option>

                ))}

              </select>

            </div>

          </div>


          <div style={styles.infoBox}>

            {outlierMethod === "iqr" ? (

              <>
                <strong>IQR Method:</strong> Identifies outliers
                outside Q1 - 1.5 × IQR and Q3 + 1.5 × IQR.
              </>

            ) : (

              <>
                <strong>Z-Score Method:</strong> Identifies values
                more than 3 standard deviations from the mean.
              </>

            )}

          </div>


          <div style={styles.warning}>

            {outlierTreatment === "cap" && (
              <>
                <strong>Capping:</strong> Replaces extreme values
                with the calculated lower or upper boundary.
              </>
            )}

            {outlierTreatment === "median" && (
              <>
                <strong>Median Replacement:</strong> Replaces
                detected outliers with the column median.
              </>
            )}

            {outlierTreatment === "remove" && (
              <>
                <strong>Remove Rows:</strong> Removes rows containing
                at least one outlier in the selected columns.
              </>
            )}

          </div>


          <button
            onClick={handlePreviewOutlierTreatment}
            disabled={
              processing ||
              loadingColumns ||
              selectedColumns.length === 0
            }
            style={styles.primaryButton}
          >

            {processing
              ? "Processing Outliers..."
              : "Preview Outlier Treatment"}

          </button>

        </section>

      )}


      {/* DATA TRANSFORMATION SETTINGS */}

      {activeOperation === "transformation" && (

        <section style={styles.card}>

          <h2 style={styles.sectionTitle}>
            3. Data Transformation Settings
          </h2>


          <div style={styles.settingsGrid}>

            <div>

              <label style={styles.label}>
                Transformation Operation
              </label>

              <select
                value={transformationType}
                onChange={(event) => {

                  setTransformationType(event.target.value);

                  setSelectedColumns([]);

                  setResult(null);

                  setError("");

                  setNewColumnName("");

                }}
                style={styles.select}
              >

                {TRANSFORMATIONS.map((transformation) => (

                  <option
                    key={transformation.value}
                    value={transformation.value}
                  >
                    {transformation.label}
                  </option>

                ))}

              </select>

            </div>


            <div>

              <label style={styles.label}>
                Preview Limit
              </label>

              <select
                value={previewLimit}
                onChange={(event) =>
                  setPreviewLimit(Number(event.target.value))
                }
                style={styles.select}
              >

                {[10, 20, 50, 100].map((limit) => (

                  <option key={limit} value={limit}>
                    {limit} Records
                  </option>

                ))}

              </select>

            </div>

          </div>


          {/* TRANSFORMATION DESCRIPTION */}

          <div style={styles.infoBox}>
            <strong>{selectedTransformation?.label}:</strong>{" "}
            {selectedTransformation?.description}
          </div>


          {/* RENAME INPUT */}

          {transformationType === "rename" && (

            <div style={styles.renameContainer}>

              <label style={styles.label}>
                New Column Name
              </label>

              <input
                type="text"
                value={newColumnName}
                onChange={(event) => {
                  setNewColumnName(event.target.value);
                  setResult(null);
                  setError("");
                }}
                placeholder="Enter new column name"
                style={styles.input}
                maxLength={100}
              />

              <p style={styles.muted}>
                Select exactly one column above and provide its new name.
              </p>

            </div>

          )}


          {/* OPERATION-SPECIFIC INFORMATION */}

          {transformationType === "normalize" && (

            <div style={styles.warning}>
              <strong>Min-Max Normalization:</strong>{" "}
              Transforms numerical values into a range between 0 and 1.
              Missing values are retained.
            </div>

          )}

          {transformationType === "standardize" && (

            <div style={styles.warning}>
              <strong>Z-Score Standardization:</strong>{" "}
              Transforms values based on the column mean and standard
              deviation. Missing values are retained.
            </div>

          )}

          {transformationType === "label_encode" && (

            <div style={styles.warning}>
              <strong>Label Encoding:</strong>{" "}
              Each unique category receives an integer label.
              Review the category mapping in the result.
            </div>

          )}

          {transformationType === "one_hot_encode" && (

            <div style={styles.warning}>
              <strong>One-Hot Encoding:</strong>{" "}
              Creates a separate binary column for each category.
              The original categorical column is removed from the preview.
            </div>

          )}

          {transformationType === "rename" && (

            <div style={styles.warning}>
              <strong>Column Renaming:</strong>{" "}
              Changes the selected column name without changing its values.
            </div>

          )}


          <button
            onClick={handlePreviewTransformation}
            disabled={
              processing ||
              loadingColumns ||
              selectedColumns.length === 0 ||
              (
                transformationType === "rename" &&
                !newColumnName.trim()
              )
            }
            style={styles.primaryButton}
          >

            {processing
              ? "Generating Preview..."
              : "Preview Transformation"}

          </button>

        </section>

      )}


      {/* ERROR MESSAGE */}

      {error && (

        <div style={styles.error}>
          {error}
        </div>

      )}


      {/* ====================================
          CONVERSION RESULTS
      ==================================== */}

      {result && activeOperation === "conversion" && (

        <>

          <section style={styles.card}>

            <h2 style={styles.sectionTitle}>
              4. Conversion Results
            </h2>


            <div style={styles.statsGrid}>

              <StatCard
                label="Total Rows"
                value={result.total_rows}
              />

              <StatCard
                label="Selected Columns"
                value={result.selected_columns?.length ?? 0}
              />

              <StatCard
                label="Converted Values"
                value={totalConverted}
              />

              <StatCard
                label="Invalid Values"
                value={totalInvalid}
              />

            </div>


            <h3 style={styles.sectionTitle}>
              Column Conversion Summary
            </h3>


            <div style={styles.tableWrapper}>

              <table style={styles.table}>

                <thead>

                  <tr>

                    {[
                      "Column",
                      "Original Type",
                      "Converted Type",
                      "Total Values",
                      "Converted",
                      "Invalid",
                      "Missing Before",
                      "Missing After",
                    ].map((heading) => (

                      <th key={heading} style={styles.th}>
                        {heading}
                      </th>

                    ))}

                  </tr>

                </thead>


                <tbody>

                  {conversionSummary.map((item) => (

                    <tr key={item.column}>

                      <td style={styles.td}>
                        {item.column}
                      </td>

                      <td style={styles.td}>
                        {item.original_type}
                      </td>

                      <td style={styles.td}>
                        {item.converted_type}
                      </td>

                      <td style={styles.td}>
                        {item.total_values}
                      </td>

                      <td style={styles.td}>
                        {item.converted_values}
                      </td>

                      <td style={styles.td}>
                        {item.invalid_values}
                      </td>

                      <td style={styles.td}>
                        {item.missing_before}
                      </td>

                      <td style={styles.td}>
                        {item.missing_after}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </section>


          <section style={styles.card}>

            <h2 style={styles.sectionTitle}>
              5. Before & After Preview
            </h2>

            {renderTable(
              result.before_preview,
              "Before Conversion"
            )}

            {renderTable(
              result.after_preview,
              "After Conversion"
            )}

          </section>


          <div style={styles.success}>
            Conversion preview generated successfully.
            The original dataset has not been modified.
          </div>

        </>

      )}


      {/* ====================================
          OUTLIER TREATMENT RESULTS
      ==================================== */}

      {result && activeOperation === "outlier" && (

        <>

          <section style={styles.card}>

            <h2 style={styles.sectionTitle}>
              4. Outlier Treatment Results
            </h2>


            <div style={styles.statsGrid}>

              <StatCard
                label="Total Outlier Values"
                value={treatmentSummary.total_outlier_values ?? 0}
              />

              <StatCard
                label="Affected Columns"
                value={treatmentSummary.affected_columns ?? 0}
              />

              <StatCard
                label="Values Replaced"
                value={treatmentSummary.values_replaced ?? 0}
              />

              <StatCard
                label="Rows Removed"
                value={treatmentSummary.rows_removed ?? 0}
              />

              <StatCard
                label="Original Rows"
                value={treatmentSummary.original_rows ?? 0}
              />

              <StatCard
                label="Processed Rows"
                value={treatmentSummary.processed_rows ?? 0}
              />

            </div>


            <div style={styles.infoBox}>

              <p>
                <strong>Detection Method:</strong>{" "}
                {outlierMethod.toUpperCase()}
              </p>

              <p>
                <strong>Treatment:</strong>{" "}
                {OUTLIER_TREATMENTS.find(
                  (item) => item.value === outlierTreatment
                )?.label}
              </p>

              <p>
                <strong>Selected Columns:</strong>{" "}
                {selectedColumns.join(", ")}
              </p>

            </div>


            <h3 style={styles.sectionTitle}>
              Column-wise Treatment Summary
            </h3>


            <div style={styles.tableWrapper}>

              <table style={styles.table}>

                <thead>

                  <tr>

                    {[
                      "Column",
                      "Status",
                      "Lower Bound",
                      "Upper Bound",
                      "Median",
                      "Outliers",
                      "Replaced",
                      "Rows Removed",
                    ].map((heading) => (

                      <th key={heading} style={styles.th}>
                        {heading}
                      </th>

                    ))}

                  </tr>

                </thead>


                <tbody>

                  {outlierColumnSummary.map((item) => (

                    <tr key={item.column}>

                      <td style={styles.td}>
                        {item.column}
                      </td>

                      <td style={styles.td}>
                        {item.status}
                      </td>

                      <td style={styles.td}>
                        {item.lower_bound !== undefined
                          ? Number(item.lower_bound).toFixed(3)
                          : "N/A"}
                      </td>

                      <td style={styles.td}>
                        {item.upper_bound !== undefined
                          ? Number(item.upper_bound).toFixed(3)
                          : "N/A"}
                      </td>

                      <td style={styles.td}>
                        {item.median !== undefined
                          ? Number(item.median).toFixed(3)
                          : "N/A"}
                      </td>

                      <td style={styles.td}>
                        {item.outlier_count ?? 0}
                      </td>

                      <td style={styles.td}>
                        {item.values_replaced ?? 0}
                      </td>

                      <td style={styles.td}>
                        {item.rows_removed ?? 0}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </section>


          <section style={styles.card}>

            <h2 style={styles.sectionTitle}>
              5. Before & After Preview
            </h2>

            {renderTable(
              result.before_preview,
              "Before Outlier Treatment"
            )}

            {renderTable(
              result.after_preview,
              "After Outlier Treatment"
            )}

          </section>


          <div style={styles.success}>
            Outlier treatment preview generated successfully.
            The original dataset has not been modified.
          </div>

        </>

      )}


      {/* ====================================
          DATA TRANSFORMATION RESULTS
      ==================================== */}

      {result && activeOperation === "transformation" && (

        <>

          <section style={styles.card}>

            <h2 style={styles.sectionTitle}>
              4. Data Transformation Results
            </h2>


            <div style={styles.statsGrid}>

              <StatCard
                label="Total Rows"
                value={result.total_rows}
              />

              <StatCard
                label="Processed Rows"
                value={result.processed_rows}
              />

              <StatCard
                label="Original Columns"
                value={result.original_columns?.length ?? 0}
              />

              <StatCard
                label="Processed Columns"
                value={result.processed_columns?.length ?? 0}
              />

            </div>


            <div style={styles.infoBox}>

              <p>
                <strong>Transformation:</strong>{" "}
                {TRANSFORMATIONS.find(
                  (item) => item.value === transformationType
                )?.label}
              </p>

              <p>
                <strong>Selected Columns:</strong>{" "}
                {(result.selected_columns ?? selectedColumns).join(", ")}
              </p>

              {transformationType === "rename" && (

                <p>
                  <strong>New Column Name:</strong>{" "}
                  {newColumnName}
                </p>

              )}

              <p>
                <strong>Original Dataset Modified:</strong>{" "}
                {result.original_dataset_modified === false
                  ? "No"
                  : "Not confirmed"}
              </p>

            </div>


            <h3 style={styles.sectionTitle}>
              Transformation Summary
            </h3>


            {Array.isArray(transformationSummary) &&
            transformationSummary.length > 0 ? (

              <div style={styles.tableWrapper}>

                <table style={styles.table}>

                  <thead>

                    <tr>

                      <th style={styles.th}>
                        Column
                      </th>

                      <th style={styles.th}>
                        Transformation
                      </th>

                      <th style={styles.th}>
                        Details
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {transformationSummary.map((item, index) => {

                      const details = { ...item };

                      delete details.column;
                      delete details.transformation;

                      return (

                        <tr key={index}>

                          <td style={styles.td}>
                            {item.column ??
                              item.original_column ??
                              "N/A"}
                          </td>

                          <td style={styles.td}>
                            {item.transformation ?? transformationType}
                          </td>

                          <td style={styles.td}>
                            {Object.entries(details).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <strong>{key.replace(/_/g, " ")}:</strong>{" "}
                                  {formatValue(value)}
                                </div>
                              )
                            )}
                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            ) : (

              <p style={styles.muted}>
                No transformation summary details were returned.
              </p>

            )}

          </section>


          <section style={styles.card}>

            <h2 style={styles.sectionTitle}>
              5. Before & After Preview
            </h2>

            {renderTable(
              result.before_preview,
              "Before Transformation"
            )}

            {renderTable(
              result.after_preview,
              "After Transformation"
            )}

          </section>


          <div style={styles.success}>
            Data transformation preview generated successfully.
            The original dataset has not been modified.
          </div>

        </>

      )}

    </div>

  );

};


// ==========================================
// STATISTICS CARD COMPONENT
// ==========================================

const StatCard = ({ label, value }) => (

  <div style={styles.statCard}>

    <span style={styles.statLabel}>
      {label}
    </span>

    <strong style={styles.statValue}>
      {value ?? 0}
    </strong>

  </div>

);


// ==========================================
// STYLES
// ==========================================

const styles = {

  page: {
    padding: "24px",
    color: "var(--color-text)",
    background: "var(--color-bg)",
    minHeight: "100%",
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    fontSize: "26px",
    fontWeight: 700,
    margin: "0 0 8px",
  },

  subtitle: {
    color: "var(--color-muted)",
    margin: 0,
    fontSize: "14px",
  },

  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "20px",
  },

  sectionTitle: {
    fontSize: "17px",
    fontWeight: 650,
    margin: "0 0 18px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  tabs: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  tabButton: {
    padding: "11px 18px",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },

  activeTab: {
    background: "#6366f1",
    color: "#ffffff",
    border: "1px solid #6366f1",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "8px",
  },

  select: {
    width: "100%",
    maxWidth: "450px",
    padding: "11px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    maxWidth: "450px",
    padding: "11px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  renameContainer: {
    marginBottom: "18px",
  },

  datasetInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginTop: "16px",
    fontSize: "13px",
    color: "var(--color-muted)",
  },

  actionButtons: {
    display: "flex",
    gap: "14px",
  },

  textButton: {
    border: "none",
    background: "transparent",
    color: "#818cf8",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },

  columnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    margin: "8px 0 14px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },

  settingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "18px",
  },

  warning: {
    background: "rgba(245, 158, 11, 0.10)",
    border: "1px solid rgba(245, 158, 11, 0.35)",
    borderRadius: "8px",
    padding: "13px",
    fontSize: "13px",
    lineHeight: 1.6,
    marginBottom: "18px",
  },

  infoBox: {
    background: "rgba(99, 102, 241, 0.08)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    borderRadius: "8px",
    padding: "13px",
    fontSize: "13px",
    lineHeight: 1.7,
    marginBottom: "18px",
  },

  primaryButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#6366f1",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },

  error: {
    padding: "14px",
    marginBottom: "18px",
    borderRadius: "8px",
    background: "rgba(239, 68, 68, 0.10)",
    border: "1px solid rgba(239, 68, 68, 0.35)",
    color: "var(--color-text)",
    fontSize: "13px",
  },

  success: {
    padding: "14px",
    marginBottom: "20px",
    borderRadius: "8px",
    background: "rgba(34, 197, 94, 0.10)",
    border: "1px solid rgba(34, 197, 94, 0.35)",
    fontSize: "13px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },

  statCard: {
    padding: "16px",
    border: "1px solid var(--color-border)",
    borderRadius: "9px",
  },

  statLabel: {
    display: "block",
    color: "var(--color-muted)",
    fontSize: "12px",
    marginBottom: "8px",
  },

  statValue: {
    fontSize: "23px",
    fontWeight: 700,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginBottom: "20px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "var(--color-bg)",
    borderBottom: "1px solid var(--color-border)",
    fontWeight: 650,
  },

  td: {
    padding: "11px 12px",
    borderBottom: "1px solid var(--color-border)",
  },

  previewSection: {
    marginTop: "22px",
  },

  emptyPreview: {
    padding: "16px",
    color: "var(--color-muted)",
    fontSize: "13px",
  },

  muted: {
    color: "var(--color-muted)",
    fontSize: "13px",
  },

};

export default DataProcessingPage;