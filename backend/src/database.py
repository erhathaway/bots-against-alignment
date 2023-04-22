from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from enum import Enum as PyEnum
import os
from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.
DATABASE_URL = os.getenv("DATABASE_URL")


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class GenerationKind(PyEnum):
    BOT_NAME = "bot_name"
    ALIGNER_PROMPT = "aligner_prompt"
    BOT_PROMPT = "bot_prompt"


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    kind = Column(Enum(GenerationKind), nullable=False)


Base.metadata.create_all(bind=engine)


class GenerationCreate(BaseModel):
    content: str
    kind: GenerationKind


class GenerationUpdate(BaseModel):
    content: str


def create_generation(generation: GenerationCreate, db: Session):
    new_generation = Generation(content=generation.content, kind=generation.kind)
    db.add(new_generation)
    db.commit()
    db.refresh(new_generation)
    return new_generation


def list_generations_by_kind(kind: GenerationKind, db: Session):
    generations = db.query(Generation).filter(Generation.kind == kind).all()
    return generations