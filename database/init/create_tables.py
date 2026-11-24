from database.config.engine import engine
from database.models import Base


def create_tables():
    try:
        Base.metadata.create_all(bind=engine)

        print("\n====================================")
        print("DATABASE TABLES CREATED SUCCESSFULLY")
        print("====================================")
        print("Database: data_copilot")

        print("\nCreated tables:")
        for table_name in Base.metadata.tables:
            print(f"- {table_name}")

    except Exception as error:
        print("\nDATABASE INITIALIZATION FAILED")
        print(f"Error: {error}")
        raise


if __name__ == "__main__":
    create_tables()