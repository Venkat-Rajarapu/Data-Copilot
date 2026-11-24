import pandas as pd
import numpy as np


# ==========================================
# NUMERIC COLUMN VALIDATION
# ==========================================

def validate_numeric_column(dataframe, column):

    if column not in dataframe.columns:
        raise ValueError(f"Column '{column}' does not exist.")

    numeric = pd.to_numeric(
        dataframe[column],
        errors="coerce",
    )

    invalid_values = int(
        (dataframe[column].notna() & numeric.isna()).sum()
    )

    if invalid_values > 0:
        raise ValueError(
            f"Column '{column}' contains {invalid_values} non-numeric values."
        )

    if numeric.notna().sum() == 0:
        raise ValueError(
            f"Column '{column}' has no numeric values."
        )

    return numeric


# ==========================================
# MIN-MAX NORMALIZATION
# ==========================================

def normalize_column(dataframe, column):

    numeric = validate_numeric_column(
        dataframe,
        column,
    )

    minimum = numeric.min()
    maximum = numeric.max()

    if maximum == minimum:

        transformed = numeric.copy()

        transformed.loc[numeric.notna()] = 0.0

    else:

        transformed = (
            (numeric - minimum)
            / (maximum - minimum)
        )

    dataframe[column] = transformed

    return {
        "column": column,
        "transformation": "normalization",
        "method": "min_max",
        "minimum_before": float(minimum),
        "maximum_before": float(maximum),
        "minimum_after": float(transformed.min()),
        "maximum_after": float(transformed.max()),
        "missing_values": int(transformed.isna().sum()),
    }


# ==========================================
# Z-SCORE STANDARDIZATION
# ==========================================

def standardize_column(dataframe, column):

    numeric = validate_numeric_column(
        dataframe,
        column,
    )

    mean = numeric.mean()
    std = numeric.std()

    if pd.isna(std) or std == 0:

        raise ValueError(
            f"Column '{column}' cannot be standardized because its standard deviation is zero."
        )

    transformed = (
        (numeric - mean)
        / std
    )

    dataframe[column] = transformed

    return {
        "column": column,
        "transformation": "standardization",
        "method": "z_score",
        "mean_before": float(mean),
        "std_before": float(std),
        "mean_after": float(transformed.mean()),
        "std_after": float(transformed.std()),
        "missing_values": int(transformed.isna().sum()),
    }


# ==========================================
# LABEL ENCODING
# ==========================================

def label_encode_column(dataframe, column):

    if column not in dataframe.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    original = dataframe[column]

    categories = sorted(
        original.dropna().unique().tolist(),
        key=lambda value: str(value),
    )

    mapping = {
        value: index
        for index, value in enumerate(categories)
    }

    encoded = original.map(mapping).astype("Int64")

    dataframe[column] = encoded

    return {
        "column": column,
        "transformation": "label_encoding",
        "total_categories": len(categories),
        "category_mapping": {
            str(key): value
            for key, value in mapping.items()
        },
        "missing_values": int(encoded.isna().sum()),
    }


# ==========================================
# ONE-HOT ENCODING
# ==========================================

def one_hot_encode_column(dataframe, column):

    if column not in dataframe.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    original = dataframe[column]

    categories = original.dropna().unique().tolist()

    if len(categories) == 0:
        raise ValueError(
            f"Column '{column}' has no categories to encode."
        )

    encoded = pd.get_dummies(
        original,
        prefix=column,
        dtype=int,
        dummy_na=False,
    )

    generated_columns = list(encoded.columns)

    conflicts = [
        name
        for name in generated_columns
        if name in dataframe.columns and name != column
    ]

    if conflicts:
        raise ValueError(
            f"One-hot encoding would create duplicate columns: {conflicts}"
        )

    dataframe.drop(
        columns=[column],
        inplace=True,
    )

    dataframe = pd.concat(
        [dataframe, encoded],
        axis=1,
    )

    return dataframe, {
        "column": column,
        "transformation": "one_hot_encoding",
        "original_categories": len(categories),
        "generated_columns": generated_columns,
        "missing_values": int(original.isna().sum()),
    }


# ==========================================
# COLUMN RENAMING
# ==========================================

def rename_column(dataframe, column, new_name):

    if column not in dataframe.columns:
        raise ValueError(
            f"Column '{column}' does not exist."
        )

    new_name = new_name.strip()

    if not new_name:
        raise ValueError(
            "New column name cannot be empty."
        )

    if new_name != column and new_name in dataframe.columns:
        raise ValueError(
            f"Column '{new_name}' already exists."
        )

    dataframe.rename(
        columns={
            column: new_name,
        },
        inplace=True,
    )

    return {
        "original_column": column,
        "new_column": new_name,
        "transformation": "column_renaming",
        "status": "success",
    }