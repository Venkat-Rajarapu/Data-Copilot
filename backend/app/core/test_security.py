from app.core.security import hash_password, verify_password

password = "TestPassword@123"

hashed_password = hash_password(password)

print("Original Password:", password)
print("Hashed Password:", hashed_password)

print(
    "Correct Password:",
    verify_password(password, hashed_password)
)

print(
    "Incorrect Password:",
    verify_password("WrongPassword@123", hashed_password)
)