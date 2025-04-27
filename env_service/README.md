# AI Service

This is a component of the Orama Backend that provides AI services.

## Prerequisites

- Python 3.8 or later
- [uv](https://github.com/astral-sh/uv) - A Python package installer and environment manager

## Getting Started

### Installation

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd orama_backend/ai_service
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
    uv pip install -r requirements.txt
    ```

### Running the Service

```bash
python main.py
```

## Development

### Installing Development Dependencies

```bash
uv pip install -r requirements-dev.txt
```

### Running Tests

```bash
pytest
```

### Adding New Dependencies

```bash
# Add a runtime dependency
uv pip install <package-name>
uv pip freeze > requirements.txt

# Add a development dependency
uv pip install <package-name>
uv pip freeze > requirements-dev.txt
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
API_KEY=your_api_key
DEBUG=True
```

## Project Structure

```
ai_service/
├── README.md           # This file
├── main.py             # Entry point for the application
├── requirements.txt    # Production dependencies
└── requirements-dev.txt # Development dependencies
```

## License

