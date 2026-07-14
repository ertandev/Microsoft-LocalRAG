import sqlite3
import json
from foundry_local_sdk import Configuration, FoundryLocalManager

try:
    print("1. Foundry Local ve Veri Tabanı başlatılıyor...")
    # Foundry Local'i başlatıyoruz
    config = Configuration(app_name="local_rag_app")
    FoundryLocalManager.initialize(config)
    manager = FoundryLocalManager.instance

    # Kelimeleri sayıya çevirecek olan Embedding modelimizi seçiyoruz
    embedding_alias = "qwen3-embedding-0.6b"
    model = manager.catalog.get_model(embedding_alias)

    # Eğer model bilgisayarda yoksa indiriyoruz
    if not model.is_cached:
        print(f"2. Embedding modeli ({embedding_alias}) indiriliyor...")
        model.download(progress_callback=lambda pct: print(f"İndirme Durumu: {pct:.1f}%", end="\r"))
        print("\nİndirme tamamlandı!")
    else:
        print(f"2. {embedding_alias} zaten bilgisayarda kayıtlı.")

    # Modeli hafızaya yüklüyoruz
    model.load()
    print("Model başarıyla yüklendi!")

    # Sayıya çevirme aracını (client) alıyoruz
    embedding_client = model.get_embedding_client()

    # Örnek belgelerimiz (Bunlar bizim RAG için kullanacağımız bilgi kaynağımız)
    documents = [
        "Yaz okulu Foundry Local eğitimi toplamda 6 hafta sürecektir.",
        "Öğrenciler 3. ve 4. haftada yerel RAG boru hattını (pipeline) kuracaklar.",
        "Microsoft stajyerleri projelerini tamamen yerel (offline) olarak geliştirmektedir."
    ]

    # SQLite veritabanı dosyası oluşturuyoruz (Varsa açar, yoksa sıfırdan oluşturur)
    db_path = "knowledge_base.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Eğer tablo yoksa 'documents' adında bir tablo oluşturuyoruz
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT,
            embedding TEXT
        )
    """)
    conn.commit()

    print("\n3. Belgeler sayıya (vektöre) çevriliyor ve SQLite'a kaydediliyor...")
    
    # Eski kayıtları temizleyelim (her çalıştırdığımızda temiz başlasın)
    cursor.execute("DELETE FROM documents")
    conn.commit()

    for doc in documents:
        # Cümleyi sayı dizisine (vektöre) çeviriyoruz
        response = embedding_client.generate_embedding(doc)
        vector = response.data[0].embedding
        
        # Sayı dizisini veri tabanına kaydetmek için yazıya (JSON text) çeviriyoruz
        vector_str = json.dumps(vector)

        # Veri tabanına kaydediyoruz
        cursor.execute("INSERT INTO documents (text, embedding) VALUES (?, ?)", (doc, vector_str))
        print(f"-> Kaydedildi: '{doc[:35]}...' | Vektör boyutu: {len(vector)} sayı")

    conn.commit()
    print("\nTüm belgeler başarıyla SQLite veritabanına kaydedildi!")
    
    # Veri tabanından test amaçlı verileri çekip gösterelim
    cursor.execute("SELECT id, text FROM documents")
    rows = cursor.fetchall()
    print("\nSQLite Veritabanı İçeriği:")
    for row in rows:
        print(f"ID {row[0]}: {row[1]}")

    conn.close()

except Exception as e:
    import traceback
    print("Bir hata oluştu:")
    traceback.print_exc()
