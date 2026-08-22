# Contributing to Sextant

Thank you for your interest in contributing to Sextant! This document provides guidelines for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Messages](#commit-messages)
6. [Pull Requests](#pull-requests)
7. [Testing](#testing)
8. [Documentation](#documentation)

## Code of Conduct

Please be respectful and inclusive in all interactions. We welcome contributions from everyone and are committed to providing a welcoming environment.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/sextant.git`
3. Add upstream remote: `git remote add upstream https://github.com/ORIGINAL_OWNER/sextant.git`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Setup

### Frontend Development

```bash
cd app

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Format code
npx prettier --write src/

# Lint
npm run lint
```

### Backend Development

```bash
cd api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Install dev dependencies
pip install -r requirements-dev.txt

# Run application
python -m uvicorn app.main:app --reload

# Run tests
pytest

# Run with coverage
pytest --cov=app

# Format code
black app/

# Lint
flake8 app/
pylint app/

# Type check
mypy app/
```

## Coding Standards

### Python (Backend)

- **Style Guide**: PEP 8
- **Formatter**: Black
- **Linter**: Flake8, Pylint
- **Type Hints**: Required for all functions
- **Docstrings**: Google style for all modules, classes, and functions

**Example:**

```python
def process_user_data(user_id: str, data: dict[str, Any]) -> UserResponse:
    """Process user data and return updated user response.
    
    Args:
        user_id: The unique user identifier
        data: Dictionary containing user data to process
        
    Returns:
        UserResponse: Updated user response object
        
    Raises:
        ValueError: If user_id is empty
        HTTPException: If database operation fails
    """
    if not user_id:
        raise ValueError("user_id cannot be empty")
    
    # Implementation
    return user_response
```

### TypeScript (Frontend)

- **Style Guide**: Airbnb TypeScript
- **Formatter**: Prettier
- **Linter**: ESLint
- **Type Checking**: Strict mode enabled
- **Components**: Functional components with hooks

**Example:**

```typescript
interface UserProfileProps {
  userId: string
  onUpdate?: (user: User) => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user data
  }, [userId])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!user) return null

  return (
    <div className="user-profile">
      {/* Render user profile */}
    </div>
  )
}
```

## Commit Messages

Follow conventional commit format:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons)
- `refactor`: Code refactoring without feature/fix
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

**Examples:**

```
feat(auth): add OAuth2 token refresh mechanism

Implement automatic token refresh for expired access tokens.
Adds interceptor to FastAPI client for seamless token renewal.

Closes #123
```

```
fix(api): handle null values in user profile endpoint

Previously, null values in optional user fields caused validation errors.
Now properly handles missing optional fields.

Fixes #456
```

```
docs(keycloak): update security configuration guide

Add detailed steps for setting up realm roles and client scopes.
Include troubleshooting section for common Keycloak issues.
```

## Pull Requests

### Before Submitting

1. Update your branch with latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Run tests:
   - Backend: `pytest`
   - Frontend: `npm test`

3. Run linters:
   - Backend: `black .`, `flake8 .`, `pylint app/`
   - Frontend: `npm run lint`, `npx prettier --check .`

4. Build locally:
   - Backend: `docker build ./api`
   - Frontend: `npm run build`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Testing
- [ ] Added tests
- [ ] Updated tests
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] Changes tested locally
```

### Review Process

1. Automated checks must pass (linting, tests, builds)
2. At least 2 approvals required from maintainers
3. All conversations must be resolved
4. Branch must be up to date with main
5. Squash commits before merge (if needed)

## Testing

### Backend Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_users.py

# Run with coverage
pytest --cov=app --cov-report=html

# Run with verbose output
pytest -v

# Run specific test
pytest tests/test_users.py::test_get_user
```

**Test Structure:**

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestUsers:
    """Tests for user endpoints."""
    
    @pytest.fixture
    def auth_headers(self):
        """Fixture providing auth headers."""
        return {"Authorization": f"Bearer {test_token}"}
    
    def test_get_current_user(self, auth_headers):
        """Test retrieving current user profile."""
        response = client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        assert "username" in response.json()
```

### Frontend Tests

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- UserProfile.test.tsx

# Watch mode
npm test -- --watch
```

**Test Structure:**

```typescript
import { render, screen } from '@testing-library/react'
import { UserProfile } from './UserProfile'

describe('UserProfile', () => {
  it('renders user name', () => {
    const mockUser = { id: '1', username: 'demo' }
    render(<UserProfile user={mockUser} />)
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<UserProfile isLoading={true} />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
```

## Documentation

### Code Documentation

- Add docstrings to all public functions, classes, and modules
- Keep comments concise and meaningful
- Explain WHY, not WHAT (code should be self-documenting for WHAT)
- Update docstrings when behavior changes

### Markdown Documentation

- Use clear, concise language
- Include code examples
- Keep lines under 100 characters where practical
- Use proper heading hierarchy (H1 > H2 > H3, etc.)
- Add table of contents for longer documents

**Example:**

```markdown
# Feature Name

Brief description of the feature.

## Overview

Detailed explanation with context.

## Usage

### Basic Example

```typescript
const example = useFeature()
```

### Advanced Usage

More complex examples with explanations.

## API Reference

### Function

```python
def my_function(arg1: str) -> dict:
```

**Parameters:**
- `arg1` (str): Description

**Returns:**
- dict: Description

## Troubleshooting

Common issues and solutions.
```

## Questions?

- Create a GitHub Discussion
- Open an issue for bugs
- Ask in pull request comments
- Email: support@example.com

## License

By contributing, you agree that your contributions will be licensed under the project's license.

Thank you for contributing to Sextant! 🚀
