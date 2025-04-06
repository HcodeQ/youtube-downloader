from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Créer un dossier "downloads" si ce n'est pas déjà fait
os.makedirs('downloads', exist_ok=True)

@app.route('/video-info', methods=['POST'])
def fetch_video_info():
    video_url = request.json.get('video_url')

    if not video_url:
        return jsonify({"message": "No video URL provided"}), 400

    ydl_opts = {}

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extraire les métadonnées de la vidéo sans téléchargement
            info = ydl.extract_info(video_url, download=False)
            
            # Récupérer les informations nécessaires
            video_info = {
                "title": info.get('title', 'N/A'),  # Titre de la vidéo
                "views": f"{info.get('view_count', 0):,}",  # Nombre de vues, formaté
                "channel": info.get('uploader', 'N/A'),  # Nom de la chaîne
                "duration": info.get('duration_string', 'N/A') if 'duration_string' in info else f"{info.get('duration', 0)//60}:{info.get('duration', 0)%60:02}",  # Durée formatée
                "thumbnailUrl": info.get('thumbnail', 'N/A')  # URL de la miniature
            }

            return jsonify(video_info), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/formats', methods=['POST'])
def fetch_formats():
    video_url = request.json.get('video_url')

    if not video_url:
        return jsonify({"message": "No video URL provided"}), 400

    ydl_opts = {}

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            formats = info.get('formats', [])
             # Filtrer uniquement les formats avec les IDs 18, 22, 37, et 140
            selected_formats = [
                {
                    "format_id": f["format_id"],
                    "resolution": f.get("height", "audio"),  # "audio" si c'est un format audio
                    "ext": f["ext"],
                }
                for f in formats
                if f["format_id"] in ["18", "22", "37", "140", "133","134","135","136","137", "160"]
            ]

            return jsonify({"formats": selected_formats}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/download', methods=['POST'])
def download_video():
    # Récupérer les données envoyées par le frontend
    video_url = request.json.get('video_url')
    video_format = request.json.get('format')  # Nouveau paramètre pour le format

    if not video_url:
        return jsonify({"message": "No video URL provided"}), 400

    # Ajouter les options de format et de progression
    progress = {"status": "downloading", "progress": 0}

    def progress_hook(d):
        if d['status'] == 'downloading':
            progress['progress'] = d['_percent_str']
        elif d['status'] == 'finished':
            progress['status'] = 'finished'

    ydl_opts = {
        'outtmpl': 'downloads/%(title)s.%(ext)s',
        'format': video_format if video_format else 'best',  # Utiliser le format choisi ou 'best' par défaut
        'progress_hooks': [progress_hook],  # Ajouter le hook de progression
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:    
            ydl.download([video_url])
        return jsonify({"message": "Video downloaded successfully", "progress": 100}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)