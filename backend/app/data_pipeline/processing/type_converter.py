import pandas as pd


# ==========================================
# BOOLEAN VALUE MAPPING
# ==========================================

TRUE_VALUES = {
    "true", "1", "yes", "y"
}

FALSE_VALUES = {
    "false", "0", "no", "n"
}


# ==========================================
# DATA TYPE CONVERSION
# ==========================================

def convert_column_type(
    dataframe: pd.DataFrame,
    column: str,
    target_type: str,
):

    original = dataframe[column].copy()

    original_dtype = str(original.dtype)

    missing_before = int(original.isna().sum())

    invalid_values = 0

    # ======================================
    # INTEGER
    # ======================================

    if target_type == "integer":

        numeric = pd.to_numeric(
            original,
            errors="coerce",
        )

        fractional = (
            numeric.notna()
            & (numeric % 1 != 0)
        )

        invalid_mask = (
            original.notna()
            & (numeric.isna() | fractional)
        )

        invalid_values = int(
            invalid_mask.sum()
        )

        numeric = numeric.mask(
            fractional
        )

        dataframe[column] = numeric.astype(
            "Int64"
        )

    # ======================================
    # FLOAT
    # ======================================

    elif target_type == "float":

        numeric = pd.to_numeric(
            original,
            errors="coerce",
        )

        invalid_values = int(
            (original.notna() & numeric.isna()).sum()
        )

        dataframe[column] = numeric.astype(
            "Float64"
        )

    # ======================================
    # STRING
    # ======================================

    elif target_type == "string":

        dataframe[column] = original.astype(
            "string"
        )

    # ======================================
    # DATETIME
    # ======================================

    elif target_type == "datetime":

        converted = pd.to_datetime(
            original,
            errors="coerce",
        )

        invalid_values = int(
            (original.notna() & converted.isna()).sum()
        )

        dataframe[column] = converted

    # ======================================
    # BOOLEAN
    # ======================================

    elif target_type == "boolean":

        normalized = (
            original.astype("string")
            .str.strip()
            .str.lower()
        )

        mapping = {
            **{value: True for value in TRUE_VALUES},
            **{value: False for value in FALSE_VALUES},
        }

        converted = normalized.map(mapping)

        invalid_values = int(
            (original.notna() & converted.isna()).sum()
        )

        dataframe[column] = converted.astype(
            "boolean"
        )

    else:

        raise ValueError(
            f"Unsupported target type: {target_type}"
        )

    # ======================================
    # CONVERSION STATISTICS
    # ======================================

    missing_after = int(
        dataframe[column].isna().sum()
    )

    return {

        "column": column,

        "original_type": original_dtype,

        "converted_type": str(
            dataframe[column].dtype
        ),

        "target_type": target_type,

        "total_values": len(original),

        "missing_before": missing_before,

        "missing_after": missing_after,

        "converted_values": int(
            original.notna().sum() - invalid_values
        ),

        "invalid_values": invalid_values,
    }