import getpass

from sqlalchemy import select

from database.config.session import SessionLocal
from database.models import Role, User

from app.core.security import hash_password


# ==========================================
# INITIAL ADMIN SETUP
# ==========================================

def create_initial_admin():

    db = SessionLocal()

    try:

        # Check Admin role
        admin_role = db.scalar(
            select(Role).where(Role.id == 1)
        )

        if admin_role is None:
            print("Admin role not found.")
            return

        # Check existing Admin accounts
        existing_admin = db.scalar(
            select(User).where(User.role_id == 1)
        )

        if existing_admin:
            print("An Admin account already exists.")
            print("No changes were made.")
            return

        print("\n===== DATA COPILOT INITIAL ADMIN SETUP =====\n")

        full_name = input("Enter Admin Full Name: ").strip()

        email = input("Enter Admin Email: ").strip().lower()

        password = getpass.getpass("Enter Admin Password: ")

        confirm_password = getpass.getpass(
            "Confirm Admin Password: "
        )

        if len(full_name) < 2:
            print("Full name must contain at least 2 characters.")
            return

        if "@" not in email:
            print("Enter a valid email address.")
            return

        if len(password) < 8:
            print("Password must contain at least 8 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        # Check duplicate email
        existing_user = db.scalar(
            select(User).where(User.email == email)
        )

        if existing_user:
            print("This email is already registered.")
            return

        # Create Admin
        admin = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role_id=1,
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\nAdmin account created successfully!")
        print(f"User ID: {admin.id}")
        print(f"Email: {admin.email}")
        print("Role: Admin")
        print("Role ID: 1")

    except Exception as error:

        db.rollback()

        print(f"Admin setup failed: {error}")

    finally:

        db.close()


if __name__ == "__main__":
    create_initial_admin()