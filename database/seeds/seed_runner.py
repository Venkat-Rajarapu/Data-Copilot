from pathlib import Path

from sqlalchemy import text

from database.config.engine import engine


def run_role_seeds():
    sql_file = Path(__file__).with_name("roles_seed.sql")

    if not sql_file.exists():
        raise FileNotFoundError(
            f"Role seed file not found: {sql_file}"
        )

    sql_query = sql_file.read_text(encoding="utf-8")

    try:
        with engine.begin() as connection:
            connection.execute(text(sql_query))

        print("[SUCCESS] Default roles seeded successfully.")

    except Exception as error:
        print("[ERROR] Role seeding failed.")
        print(f"Reason: {error}")
        raise


if __name__ == "__main__":
    print("\n================================")
    print("DATA COPILOT - DATABASE SEEDER")
    print("================================\n")

    run_role_seeds()

    print("\nDatabase seeding completed.")