from sqlalchemy import Column, Integer, String
from config.db import Base

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    stock = Column(Integer)
    threshold = Column(Integer)
