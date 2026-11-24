from app.core.security import hash_password, verify_password

# Original password
password = "DataCopilot@123"

# Generate password hash
hashed_password = hash_password(password)

print("Original Password:", password)
print("Hashed Password:", hashed_password)

# Verify correct password
assert verify_password(password, hashed_password)

# Verify incorrect password
assert not verify_password("WrongPassword@123", hashed_password)

print("\nPASSWORD SECURITY TESTS PASSED!")