## 📌 Description

Provide a clear and concise summary of the changes introduced in this Pull Request.

- Related Issue / Assignment Step: #
- Feature / Module: `src/...`

---

## 🛠️ Type of Change

Please delete options that are not relevant:

- [ ] 🚀 New Feature (non-breaking change introducing new CG/IP processing or GUI elements)
- [ ] 🐛 Bug Fix (non-breaking change fixing an issue or rendering bug)
- [ ] 🧹 Code Refactor / Style (PEP 8, docstring, or architectural improvement)
- [ ] 📚 Documentation Update (README, architecture specs, or inline docstrings)
- [ ] 🧪 Tests (adding new smoke tests or updating test coverage)

---

## 🧪 Verification & Testing

Explain how these changes were tested and verified:

### 1. Headless Smoke Tests
- [ ] Executed `python -m unittest discover tests` with zero errors.

### 2. Manual GUI Verification
- [ ] Launched `python main.py`.
- [ ] Confirmed synthetic image generates with text `"Stylinger Pipeline OK"`.
- [ ] Verified side-by-side Grayscale + Canny Edge Detection rendering.
- [ ] Verified clean GUI application exit.

---

## 📋 Code Quality Checklist

- [ ] Code follows PEP 8 formatting guidelines.
- [ ] All functions and classes contain descriptive docstrings.
- [ ] Variable and method names are meaningful and self-documenting.
- [ ] No hardcoded temporary paths or debug print statements remaining.
- [ ] Modular boundaries respected (UI separated from processing algorithms).
