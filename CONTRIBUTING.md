# Contributing to GNOME Claude Usage Tracker

First off, thanks for considering contributing to GNOME Claude Usage Tracker! It's people like you that make this extension such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and expected behavior**

### Pull Requests

* Follow the Python and JavaScript style guides
* Include appropriate test cases
* Update documentation accordingly
* End all files with a newline
* Avoid platform-specific code

## Development Setup

```bash
# Clone the repository
git clone https://github.com/M4rio1/gnome-claude-usage-tracker.git
cd gnome-claude-usage-tracker

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install development dependencies
pip install -r requirements.txt

# Install the extension locally for testing
chmod +x install.sh
./install.sh --dev
```

## Style Guides

### Python

* Follow PEP 8
* Use `black` for formatting: `black daemon/`
* Use `pylint` for linting: `pylint daemon/`
* Use type hints where possible

### JavaScript

* Follow GNOME Shell extension standards
* Use 4 spaces for indentation
* Use descriptive variable names
* Add comments for complex logic

## Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Example:
```
Add real-time usage updates

Fixes #123
- Implement WebSocket connection for live updates
- Add event handlers for usage changes
- Update UI reactively
```

## Additional Notes

### Issue and Pull Request Labels

* `bug` - Something isn't working
* `enhancement` - New feature or request
* `documentation` - Improvements or additions to documentation
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention is needed

## Recognition

Contributors will be recognized in the README and changelog.

Thanks for contributing! 🎉