from pydantic import BaseModel, Field


class CourseCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    slug: str = Field(min_length=3, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = Field(min_length=10)
    price_cents: int = Field(ge=0)
    level: str = Field(min_length=2, max_length=40)
    duration_hours: int = Field(ge=1)
    thumbnail_url: str = Field(min_length=8, max_length=500)


class CourseUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=160)
    slug: str | None = Field(default=None, min_length=3, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, min_length=10)
    price_cents: int | None = Field(default=None, ge=0)
    level: str | None = Field(default=None, min_length=2, max_length=40)
    duration_hours: int | None = Field(default=None, ge=1)
    thumbnail_url: str | None = Field(default=None, min_length=8, max_length=500)


class CourseResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    price_cents: int
    level: str
    duration_hours: int
    thumbnail_url: str

    model_config = {"from_attributes": True}


class PurchaseResponse(BaseModel):
    id: str
    status: str
    course: CourseResponse

    model_config = {"from_attributes": True}
