# Contributing to Orama_bacnkend


## Table of Contents

- [Contributing to Orama\_bacnkend](#contributing-to-orama_bacnkend)
  - [Table of Contents](#table-of-contents)
  - [Architecture \& Tech Stack](#architecture--tech-stack)
  - [Getting Started](#getting-started)
  - [Branching Model](#branching-model)
  - [Code Style \& Linting](#code-style--linting)
  - [Testing](#testing)
  - [API Documentation](#api-documentation)
  - [Pull Request Process](#pull-request-process)
  - [Review \& Merge](#review--merge)
  - [Security \& Reporting](#security--reporting)

---

## Architecture & Tech Stack

- **SOA**: Each service lives in its own folder under `orama_backend/`  
- **Node.js** (Express.js) or **Python** (FastAPI) per service  
- **Linting**: ESLint (for JS/TS services)  
- **Testing**:  
  - Jest for Express.js services  
  - pytest for FastAPI services  
- **API Docs**: Swagger  

---

## Getting Started

1. **Clone the repo**  
   ```bash
   git clone https://github.com/Orama4/orama_backend.git
   cd orama_backend
   ```
2. **Install dependencies**  
   - For a JS service (e.g. `stats_service`):  
     ```bash
     cd stats_service
     npm install
     ```
   - For a Python service (e.g. `ai_service`):  
     ```bash
     cd ai_service
     uv pip install -r requirements.txt
     ```
3. **Run lint & tests locally** (see below)

---

## Branching Model

1. **Always start from the latest `main`**  
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create your feature branch**  
   ```bash
   git checkout -b <yourname>/feature/<short-description>
   ```
   _Example:_  
   ```bash
   git checkout -b chamil/feature/add-login-service
   ```
3. **Do NOT push directly to `main`.**  

---

## Code Style & Linting

- **ESLint** is configured per service under `.eslintrc.js`.  
- **Don’t override existing ESLint rules**—only _extend_ if absolutely necessary.  
- **Run lint** before committing:  
  ```bash
  # JS service
  npm run lint
  ```
- Fix all lint errors/warnings before opening a PR.

---

## Testing

- **Express.js (Jest)**  
  ```bash
  npm test
  ```
- **FastAPI (pytest)**  
  ```bash
  pytest
  ```
- Ensure **100%** coverage for new code paths and that all existing tests pass.

---

## API Documentation

- Every service exposes a Swagger UI at `/docs` (FastAPI) or via your chosen Express middleware.  
- **Update your Swagger spec** whenever you add or change endpoints.  
- Commit your updated `*.yaml` or inline-doc comments alongside code changes.

---

## Pull Request Process

1. Push your feature branch to origin:  
   ```bash
   git push origin <yourname>/feature/<short-description>
   ```
2. On GitHub, open a new Pull Request targeting `main`.  
3. In your PR description, include:  
   - **What** you’ve changed (summary)  
   - **Why** it’s needed (context)  
   - **How** to test (commands/endpoints)  
4. **Checklist** (ensure you’ve done all before requesting review):  
   - [ ] Branch was created from the latest `main`  
   - [ ] Code compiles/lints with no errors  
   - [ ] All tests pass locally  
   - [ ] Swagger docs updated  
   - [ ] No sensitive data or secrets all secrets in `.env` file

---

## Review & Merge

- **Quality Reviewer** will review cross‑service changes.  
- They may request changes or approve & merge.  
- Once approved, the reviewer will merge into `main` .  
- **You** do not merge your own PRs into `main`.

---

## Security & Reporting

- Always branch off the latest `main` to incorporate security patches.  
- **Vulnerabilities or security issues** should be reported privately to the team lead.  
- Do not expose secrets, credentials, or PII in code or docs.

---

Thank you for helping make this project better! 🎉  
Happy coding!  
