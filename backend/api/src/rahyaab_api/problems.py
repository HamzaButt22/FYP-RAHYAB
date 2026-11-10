"""RFC 9457 problem responses (docs/api/README.md §2).

Messages are keys the app translates; the server never echoes what the user typed (NFR-74).
"""

from fastapi.responses import JSONResponse

PROBLEM = "application/problem+json"

# Pydantic error types -> stable field-error codes used in `errors[]` and the app's message keys.
FIELD_CODES = {
    "missing": "required",
    "extra_forbidden": "not_allowed",
    "string_type": "format",
    "string_pattern_mismatch": "format",
    "string_too_short": "too_short",
    "string_too_long": "too_long",
    "int_type": "format",
    "int_parsing": "format",
    "int_from_float": "format",
    "greater_than_equal": "out_of_range",
    "less_than_equal": "out_of_range",
    "literal_error": "not_allowed",
    "enum": "not_allowed",
    "model_type": "format",
    "dict_type": "format",
    "json_invalid": "format",
}


class ProblemError(Exception):
    """Raise anywhere in a route to send a problem+json response."""

    def __init__(
        self,
        status: int,
        code: str,
        title: str,
        errors: list[dict[str, str]] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(code)
        self.status = status
        self.code = code
        self.title = title
        self.errors = errors
        self.headers = headers


def field_error(field: str, code: str) -> dict[str, str]:
    return {"field": field, "code": code, "message_key": f"errors.{field}.{code}"}


def problem_response(
    status: int,
    code: str,
    title: str,
    errors: list[dict[str, str]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body: dict[str, object] = {"type": "about:blank", "status": status, "code": code, "title": title}
    if errors:
        body["errors"] = errors
    return JSONResponse(status_code=status, content=body, media_type=PROBLEM, headers=headers)
