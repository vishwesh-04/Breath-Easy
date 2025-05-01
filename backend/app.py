from flask import Flask, render_template, request, jsonify
import os
import numpy as np
import librosa
import tensorflow as tf
import joblib
from flask_cors import CORS


# Load the model
model = joblib.load("./backend/model_fine_tunned.joblib")

# Class labels
class_labels = {
    0: "URTI",
    1: "Healthy",
    2: "Asthma",
    3: "COPD",
    4: "LRTI",
    5: "Bronchiectasis",
    6: "Pneumonia",
    7: "Bronchiolitis"
}

# Preprocess audio function
def preprocess_audio(file_stream, img_size=128):
    features = []
    try:
        y, sr = librosa.load(file_stream, sr=None)
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=img_size)
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        mel_spec_resized = tf.image.resize(mel_spec_db[..., np.newaxis], (img_size, img_size)).numpy()
        mel_spec_resized = (mel_spec_resized - mel_spec_resized.min()) / (mel_spec_resized.max() - mel_spec_resized.min())
        features.append(mel_spec_resized)
        harmonic, _ = librosa.effects.hpss(y)
        noise = y - harmonic
        hnr = 10 * np.log10(np.sum(harmonic**2) / np.sum(noise**2))
        snr = 10 * np.log10(np.sum(y**2) / np.sum(noise**2))
        hnr_max = 30  
        snr_max = 30  

        clarity_percentage = min(max((hnr / hnr_max) * 100, 0), 100)
        background_noise_percentage = min(max((snr / snr_max) * 100, 0), 100)

    except Exception as e:
        print(f"Error processing file: {e}")
        features = [np.zeros((img_size, img_size, 1))]
    return np.array(features), mel_spec_resized, [clarity_percentage, background_noise_percentage]

# Prediction function
def predict_respiratory_disease(file_stream):
    audio_features, mel_spec_resized, audio_det = preprocess_audio(file_stream)
    audio_features = audio_features.reshape(1, 128, 128, 1)
    predictions = model.predict(audio_features)
    predicted_class_idx = np.argmax(predictions, axis=1)[0]
    predicted_class = class_labels[predicted_class_idx]
    return predicted_class, predictions.tolist(), mel_spec_resized.tolist(), audio_det

# Flask app setup
app = Flask(__name__)

CORS(app)

@app.route("/analyze", methods=['POST'])
@app.route("/analyze", methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    predicted_class, predictions, _, audio_det = predict_respiratory_disease(file.stream)

    confidence = float(np.max(predictions)) * 100
    risk_level = (
        "low" if predicted_class == "Healthy" else
        "medium" if confidence < 80 else
        "high"
    )

    recommendation_map = {
        "Healthy": "Your breathing pattern appears normal. Keep up the good work!",
        "COPD": "Consult a pulmonologist. Early diagnosis helps in better treatment.",
        "Asthma": "This may be asthma. Seek medical advice for a proper assessment.",
        "URTI": "Upper respiratory signs detected. Monitor symptoms closely.",
        "LRTI": "Lower respiratory signs detected. Professional check-up recommended.",
        "Bronchiectasis": "Signs consistent with bronchiectasis. See a specialist.",
        "Pneumonia": "Possible pneumonia detected. Seek immediate medical attention.",
        "Bronchiolitis": "Possible bronchiolitis. Keep the airways clear and visit a doctor."
    }

    response = {
        "prediction": {
            "disease": predicted_class,
            "confidence": round(confidence, 2),
            "risk_level": risk_level
        },
        "audio_quality": {
            "clarity": round(float(audio_det[0]), 2),  
            "background_noise": round(float(audio_det[1]), 2)
        },
        "recommendation": recommendation_map.get(predicted_class, "Consult a doctor for further assessment.")
    }

    return jsonify(response)

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 4567))
    app.run(host='127.0.0.1', port=port, debug=True)
