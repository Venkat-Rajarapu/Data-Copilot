import uuid

from database.config.session import SessionLocal
from database.repositories.user_repository import (
    create_user,
    get_user_by_id,
    get_user_by_email,
    get_all_users,
    update_user,
    delete_user,
    authenticate_user,
)


def test_user_crud():

    db = SessionLocal()

    test_user = None

    # Generate a unique temporary email
    unique_id = uuid.uuid4().hex[:10]

    test_email = f"crud_test_{unique_id}@example.com"

    test_password = "TestPassword@123"

    try:

        print("\n====================================")
        print("DATA COPILOT - USER CRUD TESTING")
        print("====================================")

        # ==================================
        # 1. CREATE USER
        # ==================================

        print("\n[1] CREATE USER")

        test_user = create_user(
            db=db,
            full_name="CRUD Test User",
            email=test_email,
            password=test_password,
            role_id=2
        )

        print(f"SUCCESS: User created.")
        print(f"User ID: {test_user.id}")
        print(f"Email: {test_user.email}")

        # Verify password is hashed
        assert test_user.hashed_password != test_password

        print("SUCCESS: Password stored as a hash.")

        # ==================================
        # 2. GET USER BY ID
        # ==================================

        print("\n[2] GET USER BY ID")

        user = get_user_by_id(
            db,
            test_user.id
        )

        assert user is not None

        print(f"SUCCESS: Retrieved {user.full_name}")

        # ==================================
        # 3. GET USER BY EMAIL
        # ==================================

        print("\n[3] GET USER BY EMAIL")

        user = get_user_by_email(
            db,
            test_email
        )

        assert user is not None

        print(f"SUCCESS: Retrieved {user.email}")

        # ==================================
        # 4. GET ALL USERS
        # ==================================

        print("\n[4] GET ALL USERS")

        users = get_all_users(db)

        print(f"SUCCESS: Retrieved {len(users)} users")

        for item in users:
            print(
                f"ID: {item.id} | "
                f"Name: {item.full_name} | "
                f"Email: {item.email}"
            )

        # ==================================
        # 5. UPDATE USER
        # ==================================

        print("\n[5] UPDATE USER")

        updated_user = update_user(
            db=db,
            user_id=test_user.id,
            full_name="Updated CRUD User",
            email=f"updated_{test_email}",
            password="UpdatedPassword@123"
        )

        assert updated_user is not None

        print(f"SUCCESS: Updated user.")
        print(f"New Name: {updated_user.full_name}")
        print(f"New Email: {updated_user.email}")

        # Update the email reference for authentication
        test_email = updated_user.email

        # ==================================
        # 6. AUTHENTICATE USER
        # ==================================

        print("\n[6] AUTHENTICATE USER")

        authenticated_user = authenticate_user(
            db=db,
            email=test_email,
            password="UpdatedPassword@123"
        )

        assert authenticated_user is not None

        print("SUCCESS: Correct password accepted.")

        # ==================================
        # 7. TEST INCORRECT PASSWORD
        # ==================================

        print("\n[7] TEST INCORRECT PASSWORD")

        invalid_user = authenticate_user(
            db=db,
            email=test_email,
            password="WrongPassword@123"
        )

        assert invalid_user is None

        print("SUCCESS: Incorrect password rejected.")

        # ==================================
        # 8. DELETE USER
        # ==================================

        print("\n[8] DELETE USER")

        user_id = test_user.id

        deleted = delete_user(
            db,
            user_id
        )

        assert deleted is True

        print(f"SUCCESS: Deleted temporary user ID: {user_id}")

        # ==================================
        # 9. VERIFY DELETION
        # ==================================

        print("\n[9] VERIFY DELETION")

        deleted_user = get_user_by_id(
            db,
            user_id
        )

        assert deleted_user is None

        print("SUCCESS: User no longer exists.")

        test_user = None

        # ==================================
        # FINAL RESULT
        # ==================================

        print("\n====================================")
        print("ALL USER CRUD TESTS PASSED")
        print("====================================")

    except Exception as error:

        print("\nUSER CRUD TEST FAILED")
        print(f"Error: {error}")

        raise

    finally:

        # Clean up temporary user if a test failed
        if test_user is not None:

            try:
                db.rollback()

                remaining_user = get_user_by_id(
                    db,
                    test_user.id
                )

                if remaining_user is not None:
                    delete_user(db, test_user.id)

                    print("\nTemporary test user cleaned up.")

            except Exception as cleanup_error:

                db.rollback()

                print(
                    f"Cleanup warning: {cleanup_error}"
                )

        db.close()


if __name__ == "__main__":
    test_user_crud()