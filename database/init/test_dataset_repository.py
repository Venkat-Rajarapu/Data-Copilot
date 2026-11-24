import uuid

from database.config.session import SessionLocal

from database.repositories.user_repository import (
    create_user,
    delete_user,
)

from database.repositories.dataset_repository import (
    create_dataset,
    get_dataset_by_id,
    get_datasets_by_owner,
    get_all_datasets,
    update_dataset,
    delete_dataset,
)


def test_dataset_crud():

    db = SessionLocal()

    test_user = None
    test_dataset = None

    unique_id = uuid.uuid4().hex[:10]

    test_email = f"dataset_test_{unique_id}@example.com"

    try:
        print("\n====================================")
        print("DATA COPILOT - DATASET CRUD TESTING")
        print("====================================")

        # ==================================
        # 1. CREATE TEMPORARY USER
        # ==================================

        print("\n[1] CREATE TEMPORARY USER")

        test_user = create_user(
            db=db,
            full_name="Dataset Test User",
            email=test_email,
            password="TestPassword@123",
            role_id=2,
        )

        print(f"SUCCESS: User created. ID: {test_user.id}")

        # ==================================
        # 2. CREATE DATASET
        # ==================================

        print("\n[2] CREATE DATASET")

        test_dataset = create_dataset(
            db=db,
            name="Sales Analysis Dataset",
            original_filename="sales_data.csv",
            file_path="storage/uploads/test/sales_data.csv",
            file_type="csv",
            file_size=10240,
            owner_id=test_user.id,
        )

        print(f"SUCCESS: Dataset created. ID: {test_dataset.id}")
        print(f"Dataset Name: {test_dataset.name}")

        # ==================================
        # 3. GET DATASET BY ID
        # ==================================

        print("\n[3] GET DATASET BY ID")

        dataset = get_dataset_by_id(
            db,
            test_dataset.id,
        )

        assert dataset is not None

        print(f"SUCCESS: Retrieved {dataset.name}")

        # ==================================
        # 4. GET DATASETS BY OWNER
        # ==================================

        print("\n[4] GET DATASETS BY OWNER")

        owner_datasets = get_datasets_by_owner(
            db,
            test_user.id,
        )

        assert any(
            item.id == test_dataset.id
            for item in owner_datasets
        )

        print(
            f"SUCCESS: Retrieved {len(owner_datasets)} "
            f"dataset(s) for the test user."
        )

        # ==================================
        # 5. GET ALL DATASETS
        # ==================================

        print("\n[5] GET ALL DATASETS")

        all_datasets = get_all_datasets(db)

        assert any(
            item.id == test_dataset.id
            for item in all_datasets
        )

        print(f"SUCCESS: Retrieved {len(all_datasets)} dataset(s).")

        # ==================================
        # 6. UPDATE DATASET
        # ==================================

        print("\n[6] UPDATE DATASET")

        updated_dataset = update_dataset(
            db=db,
            dataset_id=test_dataset.id,
            name="Updated Sales Dataset",
            row_count=500,
            column_count=8,
            status="processed",
        )

        assert updated_dataset is not None
        assert updated_dataset.name == "Updated Sales Dataset"
        assert updated_dataset.row_count == 500
        assert updated_dataset.column_count == 8
        assert updated_dataset.status == "processed"

        print("SUCCESS: Dataset updated.")
        print(f"New Name: {updated_dataset.name}")
        print(f"Rows: {updated_dataset.row_count}")
        print(f"Columns: {updated_dataset.column_count}")
        print(f"Status: {updated_dataset.status}")

        # ==================================
        # 7. DELETE DATASET
        # ==================================

        print("\n[7] DELETE DATASET")

        dataset_id = test_dataset.id

        deleted = delete_dataset(
            db=db,
            dataset_id=dataset_id,
            owner_id=test_user.id,
        )

        assert deleted is True

        print(f"SUCCESS: Dataset ID {dataset_id} deleted.")

        # ==================================
        # 8. VERIFY DATASET DELETION
        # ==================================

        print("\n[8] VERIFY DATASET DELETION")

        deleted_dataset = get_dataset_by_id(
            db,
            dataset_id,
        )

        assert deleted_dataset is None

        print("SUCCESS: Dataset no longer exists.")

        test_dataset = None

        # ==================================
        # 9. DELETE TEMPORARY USER
        # ==================================

        print("\n[9] DELETE TEMPORARY USER")

        user_id = test_user.id

        deleted_user = delete_user(
            db,
            user_id,
        )

        assert deleted_user is True

        print(f"SUCCESS: Temporary user ID {user_id} deleted.")

        test_user = None

        # ==================================
        # FINAL RESULT
        # ==================================

        print("\n====================================")
        print("ALL DATASET CRUD TESTS PASSED")
        print("====================================")

    except Exception as error:

        print("\nDATASET CRUD TEST FAILED")
        print(f"Error: {error}")

        raise

    finally:

        # Clean up any remaining temporary dataset
        if test_dataset is not None:

            try:
                db.rollback()

                remaining_dataset = get_dataset_by_id(
                    db,
                    test_dataset.id,
                )

                if remaining_dataset is not None:
                    delete_dataset(
                        db,
                        test_dataset.id,
                        test_dataset.owner_id,
                    )

                    print("\nTemporary dataset cleaned up.")

            except Exception as cleanup_error:
                db.rollback()
                print(f"Dataset cleanup warning: {cleanup_error}")

        # Clean up temporary user
        if test_user is not None:

            try:
                db.rollback()

                delete_user(
                    db,
                    test_user.id,
                )

                print("Temporary user cleaned up.")

            except Exception as cleanup_error:
                db.rollback()
                print(f"User cleanup warning: {cleanup_error}")

        db.close()


if __name__ == "__main__":
    test_dataset_crud()
