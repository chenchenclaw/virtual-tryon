from pydantic import BaseModel

class ApiResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None
    error: str | None = None
    message: str | None = None
