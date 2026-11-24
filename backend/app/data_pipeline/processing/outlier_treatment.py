import numpy as np
import pandas as pd

from app.services.data_quality_service import detect_column_type, make_json_safe


def calculate_outlier_bounds(series: pd.Series, method: str):
    """
    Calculate outlier boundaries using IQR or Z-Score.
    Uses the same formulas as the existing outlier detection service.
    """

    numeric = pd.to_numeric(
        series.astype("string").str.replace(",", "", regex=False),
        errors="coerce",
    ).dropna()

    if len(numeric) < 3:
        return None

    if method == "iqr":
        q1 = numeric.quantile(0.25)
        q3 = numeric.quantile(0.75)
        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

    elif method == "zscore":
        mean = numeric.mean()
        std = numeric.std()

        if pd.isna(std) or std == 0:
            return None

        lower_bound = mean - (3 * std)
        upper_bound = mean + (3 * std)

    else:
        raise ValueError("Method must be either 'iqr' or 'zscore'.")

    return {
        "lower_bound": float(lower_bound),
        "upper_bound": float(upper_bound),
        "median": float(numeric.median()),
    }


def treat_outliers(
    dataframe: pd.DataFrame,
    columns: list[str],
    method: str = "iqr",
    treatment: str = "cap",
):
    """
    Apply outlier treatment to selected numeric columns.

    Supported methods:
        iqr, zscore

    Supported treatments:
        remove, cap, median

    Returns:
        processed_dataframe, treatment_summary
    """

    if not isinstance(dataframe, pd.DataFrame) or dataframe.empty:
        raise ValueError("Dataset is empty or invalid.")

    if not columns:
        raise ValueError("Select at least one column.")

    if len(columns) != len(set(columns)):
        raise ValueError("Duplicate column selections are not allowed.")

    if method not in {"iqr", "zscore"}:
        raise ValueError("Method must be either 'iqr' or 'zscore'.")

    if treatment not in {"remove", "cap", "median"}:
        raise ValueError(
            "Treatment must be 'remove', 'cap', or 'median'."
        )

    missing_columns = [
        column for column in columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Columns not found in dataset: {missing_columns}"
        )

    processed = dataframe.copy(deep=True)

    original_rows = len(processed)
    row_removal_mask = np.zeros(original_rows, dtype=bool)

    column_summaries = []
    total_outlier_values = 0
    total_values_replaced = 0

    for column in columns:

        series = processed[column]

        detected_type = detect_column_type(series)

        if detected_type not in {"integer", "float"}:
            raise ValueError(
                f"Column '{column}' is not recognized as numeric."
            )

        numeric = pd.to_numeric(
            series.astype("string").str.replace(
                ",", "", regex=False
            ),
            errors="coerce",
        )

        bounds = calculate_outlier_bounds(numeric, method)

        if bounds is None:
            column_summaries.append({
                "column": column,
                "status": "skipped",
                "reason": "Insufficient numeric values or zero standard deviation.",
                "outlier_count": 0,
                "values_replaced": 0,
                "rows_removed": 0,
            })
            continue

        lower_bound = bounds["lower_bound"]
        upper_bound = bounds["upper_bound"]
        median_value = bounds["median"]

        values = numeric.to_numpy(dtype=float)

        valid_mask = ~np.isnan(values)

        outlier_mask = (
            valid_mask
            & (
                (values < lower_bound)
                | (values > upper_bound)
            )
        )

        outlier_positions = np.flatnonzero(outlier_mask)

        outlier_count = int(len(outlier_positions))

        total_outlier_values += outlier_count

        values_replaced = 0
        rows_removed = 0

        if treatment == "remove":

            row_removal_mask |= outlier_mask

        elif treatment == "cap":

            values[outlier_mask] = np.clip(
                values[outlier_mask],
                lower_bound,
                upper_bound,
            )

            processed[column] = pd.Series(
                values,
                index=processed.index,
            )

            values_replaced = outlier_count

        elif treatment == "median":

            values[outlier_mask] = median_value

            processed[column] = pd.Series(
                values,
                index=processed.index,
            )

            values_replaced = outlier_count

        total_values_replaced += values_replaced

        column_summaries.append({
            "column": column,
            "status": "processed",
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "median": median_value,
            "outlier_count": outlier_count,
            "outlier_percentage": round(
                (outlier_count / max(int(valid_mask.sum()), 1)) * 100,
                2,
            ),
            "values_replaced": values_replaced,
            "rows_removed": rows_removed,
        })

    # Remove rows containing at least one selected-column outlier.
    if treatment == "remove":

        rows_removed = int(row_removal_mask.sum())

        processed = processed.iloc[
            ~row_removal_mask
        ].copy()

        processed.reset_index(drop=True, inplace=True)

    else:
        rows_removed = 0

    summary = {
        "method": method,
        "treatment": treatment,
        "original_rows": original_rows,
        "processed_rows": len(processed),
        "selected_columns": columns,
        "affected_columns": sum(
            1 for item in column_summaries
            if item.get("outlier_count", 0) > 0
        ),
        "total_outlier_values": total_outlier_values,
        "values_replaced": total_values_replaced,
        "rows_removed": rows_removed,
        "column_summary": column_summaries,
        "original_dataset_modified": False,
    }

    return processed, make_json_safe(summary)