from datetime import datetime, timezone

from database.config.session import SessionLocal
from database.repositories.role_repository import (
    create_role,
    get_role_by_id,
    get_role_by_name,
    get_all_roles,
    update_role,
    delete_role,
)


def test_role_crud():

    db = SessionLocal()

    test_role = None

    # Generate a unique role name for this test
    test_role_name = (
        f"CRUD Test {datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
    )

    try:
        print("\n====================================")
        print("DATA COPILOT - ROLE CRUD TESTING")
        print("====================================")

        # 1. CREATE
        print("\n[1] CREATE ROLE")

        test_role = create_role(
            db=db,
            name=test_role_name,
            description="Temporary role for repository testing."
        )

        print(f"SUCCESS: Created role ID: {test_role.id}")
        print(f"Role Name: {test_role.name}")

        # 2. READ BY ID
        print("\n[2] GET ROLE BY ID")

        role = get_role_by_id(db, test_role.id)

        assert role is not None
        print(f"SUCCESS: Retrieved {role.name}")

        # 3. READ BY NAME
        print("\n[3] GET ROLE BY NAME")

        role = get_role_by_name(db, test_role_name)

        assert role is not None
        print(f"SUCCESS: Retrieved {role.name}")

        # 4. READ ALL
        print("\n[4] GET ALL ROLES")

        roles = get_all_roles(db)

        print(f"SUCCESS: Retrieved {len(roles)} roles")

        for item in roles:
            print(f"ID: {item.id} | Name: {item.name}")

        # 5. UPDATE
        print("\n[5] UPDATE ROLE")

        updated_role = update_role(
            db=db,
            role_id=test_role.id,
            description="Updated description for CRUD testing."
        )

        assert updated_role is not None
        assert updated_role.description == (
            "Updated description for CRUD testing."
        )

        print(f"SUCCESS: Updated {updated_role.name}")
        print(f"New Description: {updated_role.description}")

        # 6. DELETE
        print("\n[6] DELETE ROLE")

        role_id = test_role.id

        deleted = delete_role(db, role_id)

        assert deleted is True

        print(f"SUCCESS: Deleted temporary role ID: {role_id}")

        # Verify deletion
        deleted_role = get_role_by_id(db, role_id)

        assert deleted_role is None

        print("SUCCESS: Verified that the role no longer exists.")

        test_role = None

        print("\n====================================")
        print("ALL ROLE CRUD TESTS PASSED")
        print("====================================")

    except Exception as error:

        print("\nROLE CRUD TEST FAILED")
        print(f"Error: {error}")

        raise

    finally:

        # Clean up the temporary test role if it still exists
        if test_role is not None:
            try:
                db.rollback()

                remaining_role = get_role_by_id(
                    db,
                    test_role.id
                )

                if remaining_role is not None:
                    delete_role(db, test_role.id)
                    print("\nTemporary test role cleaned up.")

            except Exception as cleanup_error:
                db.rollback()
                print(f"Cleanup warning: {cleanup_error}")

        db.close()


if __name__ == "__main__":
    test_role_crud()