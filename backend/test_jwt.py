from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token
)


# ==========================================
# TEST ACCESS TOKEN
# ==========================================

user_data = {
    "sub": "1",
    "email": "venkat@example.com",
    "role": "Analyst"
}

access_token = create_access_token(user_data)

print("\nACCESS TOKEN GENERATED:")
print(access_token)

decoded_access = decode_token(
    access_token,
    expected_type="access"
)

print("\nACCESS TOKEN VERIFIED:")
print(decoded_access)


# ==========================================
# TEST REFRESH TOKEN
# ==========================================

refresh_token = create_refresh_token(user_data)

print("\nREFRESH TOKEN GENERATED:")
print(refresh_token)

decoded_refresh = decode_token(
    refresh_token,
    expected_type="refresh"
)

print("\nREFRESH TOKEN VERIFIED:")
print(decoded_refresh)


# ==========================================
# TEST INVALID TOKEN TYPE
# ==========================================

invalid_check = decode_token(
    access_token,
    expected_type="refresh"
)

print("\nINVALID TOKEN TYPE CHECK:")
print(invalid_check)


# ==========================================
# TEST COMPLETION
# ==========================================

if decoded_access and decoded_refresh and invalid_check is None:
    print("\nJWT SECURITY TESTS PASSED!")
else:
    print("\nJWT SECURITY TESTS FAILED!")