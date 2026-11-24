import math
from typing import Any

import numpy as np
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

MAX_SAMPLE_VALUES = 5
MAX_ISSUE_SAMPLES = 20

QUALITY_WEIGHTS = {
    "completeness": 0.30,
    "uniqueness": 0.25,
    "validity": 0.25,
    "consistency": 0.20,
}


# ============================================================
# JSON SAFE VALUE CONVERSION
# ============================================================

def make_json_safe(value):

    if value is None:
        return None

    if isinstance(value, np.generic):
        value = value.item()

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    if isinstance(value, (pd.Timedelta,)):
        return str(value)

    if isinstance(value, float):

        if not math.isfinite(value):
            return None

    if isinstance(value, (dict, list, tuple)):
        return value

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    if isinstance(value, (str, int, float, bool)):
        return value

    return str(value)


# ============================================================
# INTELLIGENT DATA TYPE DETECTION
# ============================================================

def detect_column_type(series: pd.Series) -> str:

    column_name = str(series.name).lower()

    identifier_keywords = [
        "id",
        "code",
        "phone",
        "mobile",
        "postal",
        "zip",
        "regd",
        "registration",
    ]

    if any(
        keyword in column_name
        for keyword in identifier_keywords
    ):
        return "identifier"

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    if pd.api.types.is_integer_dtype(series):
        return "integer"

    if pd.api.types.is_float_dtype(series):
        return "float"

    cleaned = series.dropna().astype(str).str.strip()

    if cleaned.empty:
        return "unknown"

    date_keywords = [
        "date",
        "datetime",
        "timestamp",
    ]

    if any(
        keyword in column_name
        for keyword in date_keywords
    ):

        parsed_dates = pd.to_datetime(
            cleaned,
            errors="coerce",
            format="mixed",
        )

        if parsed_dates.notna().mean() >= 0.8:
            return "datetime"

    numeric_values = pd.to_numeric(
        cleaned.str.replace(",", "", regex=False),
        errors="coerce",
    )

    numeric_ratio = numeric_values.notna().mean()

    if numeric_ratio >= 0.8:

        if (
            numeric_values.dropna() % 1 == 0
        ).all():
            return "integer"

        return "float"

    return "string"


# ============================================================
# NUMERIC COLUMN STATISTICS
# ============================================================

def get_numeric_statistics(series: pd.Series) -> dict:

    numeric_series = pd.to_numeric(
        series,
        errors="coerce",
    ).dropna()

    if numeric_series.empty:
        return {}

    return {
        "minimum": make_json_safe(numeric_series.min()),
        "maximum": make_json_safe(numeric_series.max()),
        "mean": make_json_safe(round(float(numeric_series.mean()), 2)),
        "median": make_json_safe(round(float(numeric_series.median()), 2)),
        "standard_deviation": make_json_safe(
            round(float(numeric_series.std()), 2)
        ),
        "sum": make_json_safe(round(float(numeric_series.sum()), 2)),
    }


# ============================================================
# CATEGORICAL COLUMN STATISTICS
# ============================================================

def get_categorical_statistics(series: pd.Series) -> dict:

    cleaned_series = series.dropna().astype(str)

    if cleaned_series.empty:
        return {
            "most_frequent_value": None,
            "most_frequent_count": 0,
        }

    frequencies = cleaned_series.value_counts()

    return {
        "most_frequent_value": str(frequencies.index[0]),
        "most_frequent_count": int(frequencies.iloc[0]),
    }


# ============================================================
# PROFILE INDIVIDUAL COLUMN
# ============================================================

def profile_column(series: pd.Series) -> dict:

    total_rows = len(series)

    missing_count = int(series.isna().sum())

    non_missing_count = total_rows - missing_count

    unique_count = int(series.nunique(dropna=True))

    missing_percentage = (
        missing_count / total_rows * 100
        if total_rows > 0 else 0
    )

    unique_percentage = (
        unique_count / non_missing_count * 100
        if non_missing_count > 0 else 0
    )

    data_type = detect_column_type(series)

    sample_values = [
        make_json_safe(value)
        for value in series.dropna().head(MAX_SAMPLE_VALUES).tolist()
    ]

    result = {
        "column_name": str(series.name),
        "data_type": data_type,
        "total_values": total_rows,
        "non_missing_values": non_missing_count,
        "missing_values": missing_count,
        "missing_percentage": round(missing_percentage, 2),
        "unique_values": unique_count,
        "unique_percentage": round(unique_percentage, 2),
        "sample_values": sample_values,
    }

    if data_type in {"integer", "float"}:

        numeric_series = pd.to_numeric(
            series.astype(str).str.replace(",", "", regex=False),
            errors="coerce",
        )

        result["statistics"] = get_numeric_statistics(
            numeric_series
        )

    elif data_type == "datetime":

        dates = pd.to_datetime(
            series,
            errors="coerce",
            format="mixed",
        ).dropna()

        result["statistics"] = {
            "minimum": make_json_safe(dates.min()),
            "maximum": make_json_safe(dates.max()),
        }

    else:

        result["statistics"] = get_categorical_statistics(
            series
        )

    return result


# ============================================================
# PHASE 5.1 - DATASET PROFILING ENGINE
# ============================================================

def profile_dataset(dataframe: pd.DataFrame) -> dict:

    if dataframe.empty:
        raise ValueError("Cannot profile an empty dataset.")

    total_rows = len(dataframe)
    total_columns = len(dataframe.columns)
    total_cells = total_rows * total_columns

    missing_values = int(dataframe.isna().sum().sum())

    missing_percentage = (
        missing_values / total_cells * 100
        if total_cells > 0 else 0
    )

    completeness_percentage = 100 - missing_percentage

    duplicate_rows = int(dataframe.duplicated().sum())

    duplicate_percentage = (
        duplicate_rows / total_rows * 100
        if total_rows > 0 else 0
    )

    columns = [
        profile_column(dataframe[column])
        for column in dataframe.columns
    ]

    data_type_distribution = {}

    for column in columns:

        data_type = column["data_type"]

        data_type_distribution[data_type] = (
            data_type_distribution.get(data_type, 0) + 1
        )

    summary = {
        "total_rows": total_rows,
        "total_columns": total_columns,
        "total_cells": total_cells,
        "missing_values": missing_values,
        "missing_percentage": round(missing_percentage, 2),
        "completeness_percentage": round(
            completeness_percentage, 2
        ),
        "duplicate_rows": duplicate_rows,
        "duplicate_percentage": round(
            duplicate_percentage, 2
        ),
        "data_type_distribution": data_type_distribution,
    }

    return {
        "summary": summary,
        "columns": columns,
    }


# ============================================================
# PHASE 5.2 - MISSING VALUE DETECTION
# ============================================================

def detect_missing_values(series: pd.Series) -> pd.Series:

    null_mask = series.isna()

    blank_mask = series.map(
        lambda value: (
            isinstance(value, str)
            and value.strip() == ""
        )
    )

    return null_mask | blank_mask


def recommend_missing_value_treatment(
    series: pd.Series,
    data_type: str,
    missing_percentage: float,
) -> dict:

    missing_count = int(
        detect_missing_values(series).sum()
    )

    if missing_count == 0:

        return {
            "method": "none",
            "reason": "No missing values detected.",
            "requires_confirmation": False,
        }

    if missing_count == len(series):

        return {
            "method": "review_or_drop",
            "reason": "The entire column contains missing values.",
            "requires_confirmation": True,
        }

    if missing_percentage >= 50:

        return {
            "method": "manual_review",
            "reason": "More than or equal to 50% of the column is missing.",
            "requires_confirmation": True,
        }

    available_values = series[
        ~detect_missing_values(series)
    ]

    if data_type in {"integer", "float"}:

        numeric_values = pd.to_numeric(
            available_values.astype(str).str.replace(
                ",", "", regex=False
            ),
            errors="coerce",
        ).dropna()

        if not numeric_values.empty:

            return {
                "method": "median",
                "suggested_value": make_json_safe(
                    numeric_values.median()
                ),
                "reason": "Median imputation is suggested for numeric data.",
                "requires_confirmation": True,
            }

    if data_type == "string":

        mode_values = available_values.astype(str).mode()

        if not mode_values.empty:

            return {
                "method": "mode",
                "suggested_value": str(mode_values.iloc[0]),
                "reason": "Most frequent value is suggested.",
                "requires_confirmation": True,
            }

    return {
        "method": "manual_review",
        "reason": "Automatic treatment is not recommended for this column.",
        "requires_confirmation": True,
    }


def profile_missing_values(dataframe: pd.DataFrame) -> dict:

    total_rows = len(dataframe)
    total_columns = len(dataframe.columns)
    total_cells = total_rows * total_columns

    total_missing = 0

    affected_columns = 0
    completely_empty_columns = 0
    partially_missing_columns = 0

    columns = []

    for column in dataframe.columns:

        series = dataframe[column]

        missing_mask = detect_missing_values(series)

        missing_count = int(missing_mask.sum())

        total_missing += missing_count

        missing_percentage = (
            missing_count / total_rows * 100
            if total_rows > 0 else 0
        )

        data_type = detect_column_type(series)

        recommendation = recommend_missing_value_treatment(
            series,
            data_type,
            missing_percentage,
        )

        if missing_count > 0:
            affected_columns += 1

        if missing_count == total_rows and total_rows > 0:
            completely_empty_columns += 1

        elif missing_count > 0:
            partially_missing_columns += 1

        columns.append({
            "column_name": str(column),
            "data_type": data_type,
            "total_values": total_rows,
            "missing_values": missing_count,
            "present_values": total_rows - missing_count,
            "missing_percentage": round(
                missing_percentage, 2
            ),
            "status": (
                "missing"
                if missing_count > 0
                else "complete"
            ),
            "recommendation": recommendation,
        })

    return {
        "summary": {
            "total_rows": total_rows,
            "total_columns": total_columns,
            "total_cells": total_cells,
            "total_missing_values": total_missing,
            "missing_percentage": round(
                total_missing / total_cells * 100
                if total_cells else 0,
                2,
            ),
            "completeness_percentage": round(
                100 - (
                    total_missing / total_cells * 100
                    if total_cells else 0
                ),
                2,
            ),
            "affected_columns": affected_columns,
            "completely_empty_columns": completely_empty_columns,
            "partially_missing_columns": partially_missing_columns,
        },
        "columns": columns,
    }


# ============================================================
# PHASE 5.3 - DUPLICATE DETECTION
# ============================================================

def detect_duplicates(dataframe: pd.DataFrame) -> dict:

    total_rows = len(dataframe)

    duplicate_mask = dataframe.duplicated(keep="first")

    duplicate_count = int(duplicate_mask.sum())

    duplicate_percentage = (
        duplicate_count / total_rows * 100
        if total_rows else 0
    )

    duplicate_samples = []

    duplicate_indices = dataframe.index[duplicate_mask]

    for index in duplicate_indices[:MAX_ISSUE_SAMPLES]:

        duplicate_samples.append({
            "row_index": make_json_safe(index),
            "row_data": {
                str(column): make_json_safe(
                    dataframe.loc[index, column]
                )
                for column in dataframe.columns
            },
        })

    return {
        "summary": {
            "total_rows": total_rows,
            "duplicate_rows": duplicate_count,
            "unique_rows": total_rows - duplicate_count,
            "duplicate_percentage": round(
                duplicate_percentage, 2
            ),
            "duplicate_status": (
                "duplicates_found"
                if duplicate_count > 0
                else "no_duplicates"
            ),
        },
        "duplicate_samples": duplicate_samples,
    }


# ============================================================
# PHASE 5.4 - DATA TYPE VALIDATION
# ============================================================

def validate_data_types(dataframe: pd.DataFrame) -> dict:

    columns = []

    total_invalid_values = 0
    columns_with_errors = 0

    for column in dataframe.columns:

        series = dataframe[column]

        detected_type = detect_column_type(series)

        missing_mask = detect_missing_values(series)

        valid_values = series[~missing_mask]

        invalid_values = []

        if detected_type in {"integer", "float"}:

            converted = pd.to_numeric(
                valid_values.astype(str).str.replace(
                    ",", "", regex=False
                ),
                errors="coerce",
            )

            invalid_mask = converted.isna()

            if detected_type == "integer":

                fractional_mask = (
                    converted.notna()
                    & (converted % 1 != 0)
                )

                invalid_mask = invalid_mask | fractional_mask

        elif detected_type == "datetime":

            converted = pd.to_datetime(
                valid_values,
                errors="coerce",
                format="mixed",
            )

            invalid_mask = converted.isna()

        else:

            invalid_mask = pd.Series(
                False,
                index=valid_values.index,
            )

        invalid_series = valid_values[invalid_mask]

        invalid_count = int(len(invalid_series))

        total_invalid_values += invalid_count

        if invalid_count > 0:
            columns_with_errors += 1

        invalid_values = [
            make_json_safe(value)
            for value in invalid_series.head(
                MAX_ISSUE_SAMPLES
            ).tolist()
        ]

        columns.append({
            "column_name": str(column),
            "detected_type": detected_type,
            "total_values": len(series),
            "missing_values": int(missing_mask.sum()),
            "valid_values": len(valid_values) - invalid_count,
            "invalid_values": invalid_count,
            "invalid_percentage": round(
                invalid_count / len(valid_values) * 100
                if len(valid_values) else 0,
                2,
            ),
            "status": (
                "invalid"
                if invalid_count > 0
                else "valid"
            ),
            "invalid_samples": invalid_values,
        })

    return {
        "summary": {
            "total_columns": len(dataframe.columns),
            "columns_with_errors": columns_with_errors,
            "total_invalid_values": total_invalid_values,
            "validation_status": (
                "issues_found"
                if total_invalid_values > 0
                else "passed"
            ),
        },
        "columns": columns,
    }


# ============================================================
# PHASE 5.5 - OUTLIER DETECTION
# ============================================================

def detect_outliers(
    dataframe: pd.DataFrame,
    method: str = "iqr",
) -> dict:

    if method not in {"iqr", "zscore"}:

        raise ValueError(
            "Method must be either 'iqr' or 'zscore'."
        )

    columns = []

    total_outliers = 0
    affected_columns = 0

    for column in dataframe.columns:

        series = dataframe[column]

        data_type = detect_column_type(series)

        if data_type not in {"integer", "float"}:
            continue

        numeric_values = pd.to_numeric(
            series.astype(str).str.replace(
                ",", "", regex=False
            ),
            errors="coerce",
        ).dropna()

        if len(numeric_values) < 3:
            continue

        if method == "iqr":

            q1 = numeric_values.quantile(0.25)
            q3 = numeric_values.quantile(0.75)

            iqr = q3 - q1

            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr

            outlier_mask = (
                (numeric_values < lower_bound)
                | (numeric_values > upper_bound)
            )

        else:

            standard_deviation = numeric_values.std()

            if standard_deviation == 0:
                continue

            z_scores = (
                numeric_values - numeric_values.mean()
            ) / standard_deviation

            outlier_mask = z_scores.abs() > 3

            lower_bound = (
                numeric_values.mean()
                - 3 * standard_deviation
            )

            upper_bound = (
                numeric_values.mean()
                + 3 * standard_deviation
            )

        outlier_values = numeric_values[outlier_mask]

        outlier_count = int(len(outlier_values))

        total_outliers += outlier_count

        if outlier_count > 0:
            affected_columns += 1

        columns.append({
            "column_name": str(column),
            "method": method,
            "total_values": len(numeric_values),
            "outlier_count": outlier_count,
            "outlier_percentage": round(
                outlier_count / len(numeric_values) * 100,
                2,
            ),
            "lower_bound": make_json_safe(lower_bound),
            "upper_bound": make_json_safe(upper_bound),
            "outlier_samples": [
                make_json_safe(value)
                for value in outlier_values.head(
                    MAX_ISSUE_SAMPLES
                ).tolist()
            ],
            "status": (
                "outliers_found"
                if outlier_count > 0
                else "normal"
            ),
        })

    return {
        "summary": {
            "method": method,
            "numeric_columns_analyzed": len(columns),
            "affected_columns": affected_columns,
            "total_outliers": total_outliers,
        },
        "columns": columns,
    }


# ============================================================
# PHASE 5.6 - DATA QUALITY SCORING
# ============================================================

def calculate_quality_score(dataframe: pd.DataFrame) -> dict:

    if dataframe.empty or len(dataframe.columns) == 0:

        raise ValueError(
            "Cannot calculate quality score for an empty dataset."
        )

    total_rows = len(dataframe)
    total_cells = total_rows * len(dataframe.columns)

    missing_analysis = profile_missing_values(dataframe)

    duplicate_analysis = detect_duplicates(dataframe)

    validation_analysis = validate_data_types(dataframe)

    outlier_analysis = detect_outliers(dataframe)

    completeness_score = (
        missing_analysis["summary"]["completeness_percentage"]
    )

    uniqueness_score = (
        100 - duplicate_analysis["summary"]["duplicate_percentage"]
    )

    invalid_percentage = (
        validation_analysis["summary"]["total_invalid_values"]
        / total_cells * 100
        if total_cells else 0
    )

    validity_score = max(
        0,
        100 - invalid_percentage,
    )

    outlier_percentage = (
        outlier_analysis["summary"]["total_outliers"]
        / total_rows * 100
        if total_rows else 0
    )

    consistency_score = max(
        0,
        100 - outlier_percentage,
    )

    scores = {
        "completeness": round(completeness_score, 2),
        "uniqueness": round(uniqueness_score, 2),
        "validity": round(validity_score, 2),
        "consistency": round(consistency_score, 2),
    }

    overall_score = sum(
        scores[key] * QUALITY_WEIGHTS[key]
        for key in QUALITY_WEIGHTS
    )

    if overall_score >= 90:
        grade = "Excellent"

    elif overall_score >= 75:
        grade = "Good"

    elif overall_score >= 60:
        grade = "Fair"

    else:
        grade = "Poor"

    return {
        "overall_score": round(overall_score, 2),
        "grade": grade,
        "dimension_scores": scores,
        "weights": QUALITY_WEIGHTS,
        "issues": {
            "missing_values": missing_analysis["summary"][
                "total_missing_values"
            ],
            "duplicate_rows": duplicate_analysis["summary"][
                "duplicate_rows"
            ],
            "invalid_values": validation_analysis["summary"][
                "total_invalid_values"
            ],
            "outliers": outlier_analysis["summary"][
                "total_outliers"
            ],
        },
    }


# ============================================================
# PHASE 5.7 - QUALITY DASHBOARD DATA
# ============================================================

def generate_quality_dashboard(dataframe: pd.DataFrame) -> dict:

    profiling = profile_dataset(dataframe)

    missing = profile_missing_values(dataframe)

    duplicates = detect_duplicates(dataframe)

    validation = validate_data_types(dataframe)

    outliers = detect_outliers(dataframe)

    quality_score = calculate_quality_score(dataframe)

    return {
        "overview": {
            "total_rows": len(dataframe),
            "total_columns": len(dataframe.columns),
            "total_cells": (
                len(dataframe) * len(dataframe.columns)
            ),
            "quality_score": quality_score["overall_score"],
            "quality_grade": quality_score["grade"],
        },

        "quality_scores": quality_score["dimension_scores"],

        "missing_values": missing["summary"],

        "duplicates": duplicates["summary"],

        "validation": validation["summary"],

        "outliers": outliers["summary"],

        "data_type_distribution": profiling["summary"][
            "data_type_distribution"
        ],
    }


# ============================================================
# PHASE 5.8 - QUALITY REPORT
# ============================================================

def generate_quality_report(dataframe: pd.DataFrame) -> dict:

    profiling = profile_dataset(dataframe)

    missing = profile_missing_values(dataframe)

    duplicates = detect_duplicates(dataframe)

    validation = validate_data_types(dataframe)

    outliers = detect_outliers(dataframe)

    quality_score = calculate_quality_score(dataframe)

    recommendations = []

    if missing["summary"]["total_missing_values"] > 0:

        recommendations.append({
            "issue": "Missing Values",
            "recommendation": (
                "Review missing columns and apply appropriate "
                "imputation or removal strategies."
            ),
            "priority": "High",
        })

    if duplicates["summary"]["duplicate_rows"] > 0:

        recommendations.append({
            "issue": "Duplicate Records",
            "recommendation": (
                "Review duplicate rows before removing them."
            ),
            "priority": "Medium",
        })

    if validation["summary"]["total_invalid_values"] > 0:

        recommendations.append({
            "issue": "Data Type Validation",
            "recommendation": (
                "Correct invalid values and standardize column formats."
            ),
            "priority": "High",
        })

    if outliers["summary"]["total_outliers"] > 0:

        recommendations.append({
            "issue": "Outliers",
            "recommendation": (
                "Investigate unusual numerical values before "
                "deciding whether to retain or remove them."
            ),
            "priority": "Medium",
        })

    if not recommendations:

        recommendations.append({
            "issue": "No Major Issues",
            "recommendation": (
                "The dataset passed the implemented quality checks."
            ),
            "priority": "Low",
        })

    return {
        "report_title": "Data Quality Assessment Report",

        "dataset_summary": profiling["summary"],

        "quality_score": quality_score,

        "missing_value_analysis": missing,

        "duplicate_analysis": duplicates,

        "data_type_validation": validation,

        "outlier_analysis": outliers,

        "recommendations": recommendations,
    }