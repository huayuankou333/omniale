"""Public checker dependency, copied verbatim from upstream benchmark/sim.py.
Only ascii_lower is required; simulation helpers and private configuration are omitted.
"""
def ascii_lower(s):
    """Lower-case like ngspice does: only ASCII A-Z (non-ASCII characters in names are kept as they are)."""
    return "".join(c.lower() if "A" <= c <= "Z" else c for c in s)
