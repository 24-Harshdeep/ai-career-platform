/**
 * Machine Learning Training Pipeline for CareerOS
 * Fits a Logistic Regression model on candidate feature vectors using Gradient Descent.
 */

const fs = require("fs");
const path = require("path");
const { FEATURE_NAMES } = require("./featureExtractor");

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, z))));
}

// Generate training dataset simulating candidate metrics & hiring outcomes
function generateSyntheticDataset(samplesCount = 500) {
  const X = [];
  const y = [];

  for (let i = 0; i < samplesCount; i++) {
    const atsScore = Math.random();
    const githubHealth = Math.random();
    const skillCoverage = Math.random();
    const interviewScore = Math.random();
    const streakNormalized = Math.min(Math.random() * 1.2, 1.0);
    const projectCount = Math.min(Math.random() * 1.2, 1.0);

    const featureVector = [atsScore, githubHealth, skillCoverage, interviewScore, streakNormalized, projectCount];
    
    // Latent true score calculation with noise
    const score = (atsScore * 1.5) + (githubHealth * 1.3) + (skillCoverage * 1.9) + (interviewScore * 1.7) + (streakNormalized * 0.8) + (projectCount * 1.2) - 3.2 + ((Math.random() - 0.5) * 0.3);
    const label = sigmoid(score) > 0.5 ? 1 : 0;

    X.push(featureVector);
    y.push(label);
  }

  return { X, y };
}

function trainLogisticRegression(X, y, epochs = 1000, learningRate = 0.1) {
  const numFeatures = FEATURE_NAMES.length;
  const numSamples = X.length;
  
  let weights = new Array(numFeatures).fill(0.1);
  let bias = 0.0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    let dw = new Array(numFeatures).fill(0);
    let db = 0;

    for (let i = 0; i < numSamples; i++) {
      let z = bias;
      for (let j = 0; j < numFeatures; j++) {
        z += weights[j] * X[i][j];
      }
      const pred = sigmoid(z);
      const error = pred - y[i];

      for (let j = 0; j < numFeatures; j++) {
        dw[j] += error * X[i][j];
      }
      db += error;
    }

    for (let j = 0; j < numFeatures; j++) {
      weights[j] -= (learningRate * dw[j]) / numSamples;
    }
    bias -= (learningRate * db) / numSamples;
  }

  // Evaluate accuracy & F1-score
  let correct = 0;
  let tp = 0, fp = 0, fn = 0;

  for (let i = 0; i < numSamples; i++) {
    let z = bias;
    for (let j = 0; j < numFeatures; j++) {
      z += weights[j] * X[i][j];
    }
    const predLabel = sigmoid(z) >= 0.5 ? 1 : 0;
    if (predLabel === y[i]) correct++;
    if (predLabel === 1 && y[i] === 1) tp++;
    if (predLabel === 1 && y[i] === 0) fp++;
    if (predLabel === 0 && y[i] === 1) fn++;
  }

  const accuracy = correct / numSamples;
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1Score = (2 * precision * recall) / Math.max(0.0001, precision + recall);

  return {
    weights: weights.map(w => Math.round(w * 100) / 100),
    bias: Math.round(bias * 100) / 100,
    metrics: {
      accuracy: Math.round(accuracy * 1000) / 1000,
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1Score: Math.round(f1Score * 1000) / 1000
    }
  };
}

function runTrainingPipeline() {
  console.log("Generating synthetic dataset for CareerOS ML pipeline...");
  const { X, y } = generateSyntheticDataset(1000);
  console.log(`Training dataset created: ${X.length} samples.`);

  console.log("Fitting Logistic Regression model via Gradient Descent...");
  const result = trainLogisticRegression(X, y, 1500, 0.15);

  const modelArtifact = {
    modelType: "LogisticRegression",
    version: "1.1.0",
    trainedAt: new Date().toISOString(),
    featureNames: FEATURE_NAMES,
    weights: result.weights,
    bias: result.bias,
    metrics: result.metrics
  };

  const outputPath = path.join(__dirname, "model_weights.json");
  fs.writeFileSync(outputPath, JSON.stringify(modelArtifact, null, 2));
  console.log(`Model successfully trained and saved to ${outputPath}`);
  console.log("Metrics:", result.metrics);
}

if (require.main === module) {
  runTrainingPipeline();
}

module.exports = {
  runTrainingPipeline,
  trainLogisticRegression
};
