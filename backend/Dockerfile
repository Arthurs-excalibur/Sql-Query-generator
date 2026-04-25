FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY main.py .

# Create the data directory (DuckDB files + uploads go here)
RUN mkdir -p data/uploads

EXPOSE 3001

CMD ["python", "main.py"]
