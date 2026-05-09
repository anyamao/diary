import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.models import Base


async def init():
    engine = create_async_engine("postgresql+asyncpg://postgres@localhost:5432/diary")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init())
