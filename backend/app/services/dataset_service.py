import json
import uuid

from pathlib import Path

import pandas as pd

from fastapi import HTTPException, UploadFile, status


# ==========================================
# CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BASE_DIR / "uploads" / "datasets"

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

ALLOWED_EXTENSIONS = {
    ".csv",
    ".xlsx",
    ".xls",
}

CHUNK_SIZE = 1024 * 1024  # 1 MB


# ==========================================
# CREATE UPLOAD DIRECTORY
# ==========================================

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ==========================================
# VALIDATE FILE EXTENSION
# ==========================================

def validate_file_extension(filename: str) -> str:

    extension = Path(
        filename.replace("\\", "/")
    ).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Upload CSV, XLSX or XLS files.",
        )

    return extension


# ==========================================
# VALIDATE FILE SIZE
# ==========================================

async def validate_file_size(file: UploadFile) -> int:

    total_size = 0

    while True:

        chunk = await file.read(CHUNK_SIZE)

        if not chunk:
            break

        total_size += len(chunk)

        if total_size > MAX_FILE_SIZE:

            await file.seek(0)

            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the maximum limit of 25 MB.",
            )

    await file.seek(0)

    if total_size == 0:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    return total_size


# ==========================================
# NORMALIZE COLUMN HEADERS
# ==========================================

def normalize_columns(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:

    columns = []

    seen = {}

    for index, column in enumerate(dataframe.columns):

        column_name = str(column).strip()

        if (
            not column_name
            or column_name.lower() in {"nan", "none"}
        ):

            column_name = f"Column_{index + 1}"

        count = seen.get(column_name, 0)

        if count > 0:

            column_name = f"{column_name}_{count + 1}"

        seen[column_name] = count + 1

        columns.append(column_name)

    dataframe.columns = columns

    return dataframe


# ==========================================
# DETECT EXCEL HEADER ROW
# ==========================================

def detect_excel_header_row(
    dataframe: pd.DataFrame,
    scan_limit: int = 30,
) -> int:

    if dataframe.empty:
        return 0

    scan_dataframe = dataframe.head(scan_limit)

    best_row_index = 0

    best_score = -1

    for index, row in scan_dataframe.iterrows():

        non_empty = row.dropna()

        non_empty_count = len(non_empty)

        if non_empty_count == 0:
            continue

        string_values = [
            str(value).strip()
            for value in non_empty
            if isinstance(value, str) and str(value).strip()
        ]

        unique_count = non_empty.astype(str).nunique()

        # Prefer rows with multiple populated and distinct cells.
        # String-heavy rows are more likely to be table headers.
        score = (
            non_empty_count * 10
            + unique_count
            + len(string_values) * 2
        )

        if score > best_score:

            best_score = score

            best_row_index = index

    return int(best_row_index)


# ==========================================
# READ CSV DATASET
# ==========================================

def read_csv_dataset(
    file_path: Path,
) -> pd.DataFrame:

    try:

        return pd.read_csv(
            file_path,
            encoding="utf-8-sig",
        )

    except UnicodeDecodeError:

        return pd.read_csv(
            file_path,
            encoding="cp1252",
        )


# ==========================================
# READ EXCEL DATASET
# ==========================================

def read_excel_dataset(
    file_path: Path,
    extension: str,
) -> pd.DataFrame:

    engine = (
        "openpyxl"
        if extension == ".xlsx"
        else "xlrd"
    )

    # Read Excel without assuming first row is header.

    raw_dataframe = pd.read_excel(
        file_path,
        header=None,
        engine=engine,
    )

    if raw_dataframe.empty:

        raise ValueError(
            "Excel file contains no data."
        )

    # Detect actual header row.

    header_row = detect_excel_header_row(
        raw_dataframe
    )

    # Extract headers.

    headers = raw_dataframe.iloc[
        header_row
    ].tolist()

    # Extract rows below the detected header.

    dataframe = raw_dataframe.iloc[
        header_row + 1:
    ].copy()

    dataframe.columns = headers

    return dataframe


# ==========================================
# READ DATASET
# ==========================================

def read_dataset(
    file_path: Path,
    extension: str,
) -> pd.DataFrame:

    try:

        # ======================================
        # CSV
        # ======================================

        if extension == ".csv":

            dataframe = read_csv_dataset(
                file_path
            )

        # ======================================
        # EXCEL
        # ======================================

        elif extension in {".xlsx", ".xls"}:

            dataframe = read_excel_dataset(
                file_path=file_path,
                extension=extension,
            )

        else:

            raise ValueError(
                "Unsupported file format."
            )

        # ======================================
        # CLEAN EMPTY ROWS
        # ======================================

        dataframe = dataframe.dropna(
            how="all"
        )

        # ======================================
        # CLEAN EMPTY COLUMNS
        # ======================================

        dataframe = dataframe.dropna(
            axis=1,
            how="all"
        )

        # ======================================
        # NORMALIZE COLUMN NAMES
        # ======================================

        dataframe = normalize_columns(
            dataframe
        )

        # ======================================
        # RESET INDEX
        # ======================================

        dataframe = dataframe.reset_index(
            drop=True
        )

        # ======================================
        # VALIDATE DATASET
        # ======================================

        if dataframe.empty or len(dataframe.columns) == 0:

            raise ValueError(
                "Dataset contains no usable rows or columns."
            )

        return dataframe

    except HTTPException:

        raise

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to process dataset: {str(error)}",
        ) from error


# ==========================================
# UPLOAD DATASET
# ==========================================

async def upload_dataset(
    file: UploadFile,
) -> dict:

    if not file.filename:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a file to upload.",
        )

    original_filename = Path(
        file.filename.replace("\\", "/")
    ).name

    extension = validate_file_extension(
        original_filename
    )

    file_size = await validate_file_size(
        file
    )

    unique_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    file_path = UPLOAD_DIR / unique_filename

    try:

        # Save uploaded file.

        await file.seek(0)

        with file_path.open("wb") as destination:

            while True:

                chunk = await file.read(CHUNK_SIZE)

                if not chunk:
                    break

                destination.write(chunk)

        # Process uploaded dataset.

        dataframe = read_dataset(
            file_path=file_path,
            extension=extension,
        )

        row_count = len(dataframe)

        column_count = len(dataframe.columns)

        return {
            "original_filename": original_filename,
            "file_path": str(file_path),
            "file_type": extension.lstrip("."),
            "file_size": file_size,
            "row_count": row_count,
            "column_count": column_count,
            "status": "uploaded",
        }

    except HTTPException:

        file_path.unlink(
            missing_ok=True
        )

        raise

    except Exception as error:

        file_path.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dataset upload failed: {str(error)}",
        ) from error

    finally:

        await file.close()


# ==========================================
# VALIDATE STORED DATASET PATH
# ==========================================

def validate_stored_file_path(
    file_path: str,
) -> Path:

    safe_path = Path(
        file_path
    ).resolve()

    upload_directory = UPLOAD_DIR.resolve()

    try:

        safe_path.relative_to(
            upload_directory
        )

    except ValueError:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this file path is not allowed.",
        )

    if not safe_path.is_file():

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset file not found.",
        )

    return safe_path


# ==========================================
# PREVIEW DATASET FILE
# ==========================================

def preview_dataset_file(
    file_path: str,
    file_type: str,
    limit: int = 50,
    offset: int = 0,
    search: str | None = None,
) -> dict:

    # ======================================
    # VALIDATE PAGINATION
    # ======================================

    if limit < 1 or limit > 200:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preview limit must be between 1 and 200.",
        )

    if offset < 0:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offset cannot be negative.",
        )

    # ======================================
    # VALIDATE FILE
    # ======================================

    safe_path = validate_stored_file_path(
        file_path
    )

    extension = f".{file_type.lower().lstrip('.')}"

    # ======================================
    # READ DATASET
    # ======================================

    dataframe = read_dataset(
        file_path=safe_path,
        extension=extension,
    )

    # ======================================
    # DATASET INFORMATION
    # ======================================

    total_rows = len(dataframe)

    total_columns = len(dataframe.columns)

    missing_values = {
        str(column): int(count)
        for column, count in dataframe.isnull().sum().items()
        if count > 0
    }

    # ======================================
    # SEARCH DATASET
    # ======================================

    if search and search.strip():

        search_term = search.strip()

        matching_rows = dataframe.astype(str).apply(
            lambda column: column.str.contains(
                search_term,
                case=False,
                regex=False,
                na=False,
            )
        ).any(axis=1)

        filtered_dataframe = dataframe[
            matching_rows
        ]

    else:

        filtered_dataframe = dataframe

    filtered_rows = len(
        filtered_dataframe
    )

    # ======================================
    # PAGINATION
    # ======================================

    preview_dataframe = filtered_dataframe.iloc[
        offset:offset + limit
    ]

    # ======================================
    # CONVERT TO JSON
    # ======================================

    records = json.loads(
        preview_dataframe.to_json(
            orient="records",
            date_format="iso",
        )
    )

    # ======================================
    # RESPONSE
    # ======================================

    return {
        "columns": [
            str(column)
            for column in dataframe.columns
        ],

        "records": records,

        "total_rows": total_rows,

        "filtered_rows": filtered_rows,

        "total_columns": total_columns,

        "limit": limit,

        "offset": offset,

        "missing_values": missing_values,
    }


# ==========================================
# DELETE STORED DATASET FILE
# ==========================================

def delete_dataset_file(
    file_path: str,
) -> bool:

    safe_path = validate_stored_file_path(
        file_path
    )

    safe_path.unlink()

    return True