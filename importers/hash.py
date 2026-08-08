def hash_fnv1a_32(s: str) -> int:
    fnv_prime = 0x01000193
    h = 0x811C9DC5

    for byte in s.encode("utf-8"):
        h ^= byte
        h = (h * fnv_prime) & 0xFFFFFFFF

    return h
