# AI Service

This is a component of the Orama Backend that provides AI services.

## Prerequisites

- Python 3.8 or later
- [uv](https://github.com/astral-sh/uv) - A Python package installer and environment manager

## Getting Started

### Installation

1. Clone the repository:
    ```bash
    git clone ....
    cd orama_backend/env_service
    ```

2. Set up a virtual environment with uv:
    ```bash
    uv venv
    ```

3. Activate the virtual environment:
    ```bash
    # On Unix or MacOS
    source .venv/bin/activate
    
    # On Windows
    .venv\Scripts\activate
    ```

4. Install dependencies:
    ```bash
    uv sync 
    ```

### Running the Service

Using Python directly:
```bash
python main.py
```

Using Uvicorn (recommended for FastAPI applications):
```bash
uvicorn main:app --reload
```

This will start the service with hot-reloading enabled for development.

## Development

### Installing Development Dependencies

```bash
uv sync --dev
```

### Code Formatting

This project uses [Ruff](https://github.com/charliermarsh/ruff) for code formatting and linting:

```bash
# Format all Python files
ruff format .

# Lint all Python files
ruff check .

# Automatically fix issues when possible
ruff check --fix .
```

### Running Tests

```bash
pytest
```

### Adding New Dependencies

```bash
# Add a runtime dependency
uv add <package-name>

# Add a development dependency
uv add --dev <package-name>
```

### Removing Dependencies

```bash
# Remove a runtime dependency
uv remove <package-name>

# Remove a development dependency
uv remove --dev <package-name>
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
API_KEY=your_api_key
DEBUG=True
```

## Project Structure

```
env_service/
├── README.md              # This file
├── main.py                # Entry point for the application
├── pyproject.toml         # Project configuration
├── requirements.txt       # Production dependencies
├── requirements-dev.txt   # Development dependencies
├── uv.lock                # Lock file for dependencies
└── models/                # Directory containing ML models
    └── floorplan_detection_best.pt  # Model file
```

## License

