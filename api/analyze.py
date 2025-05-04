import numpy as np
import librosa
import tflite_runtime.interpreter as tflite  

# Load the TFLite model
interpreter = tflite.Interpreter(model_path="asserts/model.tflite")
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

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

from PIL import Image

def resize_with_pillow(mel_spec, img_size=128):
    img = Image.fromarray(mel_spec)
    img = img.resize((img_size, img_size), resample=Image.BILINEAR)
    resized = np.array(img).astype(np.float32)
    return resized


def preprocess_audio(file_stream, img_size=128):
    features = []
    try:
        y, sr = librosa.load(file_stream, sr=None)
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=img_size)
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        mel_spec_resized = resize_with_pillow(mel_spec_db)
        mel_spec_resized = mel_spec_resized[..., np.newaxis]        
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
        clarity_percentage = 0
        background_noise_percentage = 100

    return np.array(features), mel_spec_resized, [clarity_percentage, background_noise_percentage]

def predict_respiratory_disease(file_stream):
    audio_features, mel_spec_resized, audio_det = preprocess_audio(file_stream)
    audio_features = audio_features.astype(np.float32)

    if not np.array_equal(input_details[0]['shape'][1:], audio_features.shape[1:]):
        interpreter.resize_tensor_input(input_details[0]['index'], audio_features.shape)
        interpreter.allocate_tensors()

    interpreter.set_tensor(input_details[0]['index'], audio_features)
    interpreter.invoke()
    predictions = interpreter.get_tensor(output_details[0]['index'])

    predicted_class_idx = np.argmax(predictions, axis=1)[0]
    predicted_class = class_labels[predicted_class_idx]

    return predicted_class, predictions.tolist(), mel_spec_resized.tolist(), audio_det


from http.server import BaseHTTPRequestHandler, HTTPServer
import cgi
import json

class RequestHandler(BaseHTTPRequestHandler):

    def do_POST(self):
        if self.path == "/analyze":
            content_type, params = cgi.parse_header(self.headers['Content-Type'])
            
            if content_type == 'multipart/form-data':
                # Parse the form data (audio file)
                _, params = cgi.parse_header(self.headers['Content-Type'])
                boundary = params['boundary'].encode()
                content_length = int(self.headers['Content-Length'])
                raw_post_data = self.rfile.read(content_length)

                # Parse the file from the raw POST data
                file_data = self.parse_multipart_form_data(raw_post_data, boundary)

                if 'file' in file_data:
                    file_stream = file_data['file']
                    predicted_class, predictions, _, audio_det = predict_respiratory_disease(file_stream)

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

                    # Send response
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(response).encode('utf-8'))
                else:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "No file part"}).encode('utf-8'))

    def parse_multipart_form_data(self, data, boundary):
        """ Parse multipart form data and extract the file """
        result = {}
        parts = data.split(b'--' + boundary)[1:-1]
        
        for part in parts:
            disposition = part.split(b'\r\n')[1]
            if b'filename' in disposition:
                filename = disposition.split(b'filename="')[1].split(b'"')[0].decode()
                file_data = part.split(b'\r\n\r\n')[1].split(b'\r\n--')[0]
                result['file'] = file_data
        return result