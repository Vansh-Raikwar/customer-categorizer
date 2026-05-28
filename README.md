# 📊 Customer Categorizer ML Dashboard

[![Python](https://img.shields.ms/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.ms/badge/Flask-3.0%2B-green?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![CatBoost](https://img.shields.ms/badge/CatBoost-1.2%2B-yellow)](https://catboost.ai/)
[![Vercel Deployment](https://img.shields.ms/badge/Vercel-Deployment-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![CI Pipeline](https://img.shields.ms/badge/CI-GitHub--Actions-blue?logo=github-actions&logoColor=white)](https://github.com/features/actions)

An industry-level, production-grade Customer Segmentation Web Application. It loads a pre-trained **CatBoost classifier** (achieving **97.77% accuracy**) to predict customer personas in real-time, displays interactive spending analytics using **Chart.js**, allows database exploration with advanced pagination, and features a sleek glassmorphic dark-theme UI.

The application is configured to run locally or as a **Serverless Function** on the **Vercel** cloud hosting platform.

---

## ✨ Core Features

*   **🧪 Live Customer Profiler**: A categorized, multi-step input form covering demographic attributes, product purchase habits, and channel loyalty metrics.
*   **🎯 Real-time Segment Classification**: Displays the predicted segment profile immediately upon submission, with personalized target marketing strategies based on cluster demographics.
*   **📊 Spending Analytics Dashboard**: A responsive dual-dataset Bar Chart rendered dynamically using **Chart.js**, comparing the input customer's profile directly against the average profile of their predicted cohort.
*   **🗄️ Database Explorer Portal**: A fast, client-side table showing the clustered customer database (`data/clustered_data.csv`) with server-side paginated queries, refresh states, and segment category filtering.
*   **🧠 Model Insights Card**: Exhaustive parameter details of the CatBoost model (e.g. Iterations: 200, Depth: 4) and detailed descriptive breakdowns of K-Means clusters.

---

## 🏗️ Project Architecture

```
customer-categorizer/
│
├── .github/workflows/
│   └── ci.yml              # Automated testing and quality gate CI pipeline
│
├── data/
│   ├── clustered_data.csv  # Base clustered dataset
│   └── marketing_campaign.csv
│
├── model/
│   └── catboost_model.pkl  # Pre-trained serialization CatBoost classifier
│
├── templates/
│   └── index.html          # Core single-page layout
│
├── static/
│   ├── css/
│   │   └── style.css       # Premium glassmorphism dark-theme styling
│   └── js/
│       └── main.js         # Tab switching, prediction submissions, and Chart.js mapping
│
├── tests/
│   └── test_app.py         # Pytest backend endpoint test suite
│
├── app.py                  # Core Flask server and prediction API logic
├── vercel.json             # Vercel serverless deployment specification
├── requirements.txt        # Production packages
└── test-requirements.txt   # Linting and testing dev-dependencies
```

### Data Flow Diagram

```
[Web UI Form] ──(AJAX JSON Payload)──> [Flask Predict API]
                                                │
                                        (Validation & Defaults)
                                                │
                                     [CatBoost Classifier]
                                                │
                                        (Inference: Cluster ID)
                                                │
                                    [SEGMENT_PROFILES Mapping]
                                                │
[Visual Chart.js] <──(JSON Response)── [API Stats Comparison]
```

---

## 🛠️ Local Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Vansh-Raikwar/customer-categorizer.git
   cd customer-categorizer
   ```

2. **Initialize Python Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the Development Server**:
   ```bash
   python app.py
   ```
   Open your browser and navigate to [http://127.0.0.1:5000/](http://127.0.0.1:5000/).

---

## 🚀 Vercel Cloud Deployment

The project is fully pre-configured for serverless execution using the `vercel.json` descriptor.

### Continuous Deployment via GitHub (Recommended)
1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: setup Flask app, Vercel serverless configs, and tests"
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and click **New Project**.
3. Import your `customer-categorizer` repository.
4. Vercel will automatically detect the Python configuration and deploy your application as a serverless Flask app. Every subsequent push to `main` will automatically build a new production deployment.

### Manual CLI Deployment
1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy the application:
   ```bash
   vercel        # Deploy preview env
   vercel --prod # Deploy to live production
   ```

---

## 🧪 Testing & Automated CI Pipeline

The project includes strict development quality gates. To verify code locally, run:

1. **Install Dev Dependencies**:
   ```bash
   pip install -r test-requirements.txt
   ```
2. **Execute Pytest Unit Tests**:
   ```bash
   pytest tests/
   ```
3. **Execute Linting and Code Style Checks**:
   ```bash
   black --check .
   flake8 .
   ```

### GitHub Actions Workflow
The `.github/workflows/ci.yml` pipeline automatically triggers on all pushes and pull requests to `main`, validating lint standards and verifying that all unit tests pass before code is merged.
