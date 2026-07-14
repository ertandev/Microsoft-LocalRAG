import sqlite3
import json
import math
from foundry_local_sdk import Configuration, FoundryLocalManager

# İki sayı dizisi (vektör) arasındaki benzerliği ölçen matematik fonksiyonumuz (Kosinüs Benzerliği)
def cosine_similarity(v1, v2):
    dot_product = sum(x * y for x, y in zip(v1, v2))
    norm_v1 = math.sqrt(sum(x * x for x in v1))
    norm_v2 = math.sqrt(sum(x * x for x in v2))
    if not norm_v1 or not norm_v2:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

try:
    print("1. Arama sistemi başlatılıyor...")
    config = Configuration(app_name="local_rag_app")
    FoundryLocalManager.initialize(config)
    manager = FoundryLocalManager.instance

    # Embedding modelimizi yüklüyoruz (Zaten bilgisayara indiği için hızlıca yüklenecek)
    embedding_alias = "qwen3-embedding-8b"
    model = manager.catalog.get_model(embedding_alias)
    model.load()
    embedding_client = model.get_embedding_client()

    # Kullanıcıdan örnek bir soru alalım
    query = "Stajyerler projelerini nasıl geliştiriyor?"
    print(f"\n2. Sorulan Soru: '{query}'")

    # Soruyu sayı dizisine (vektöre) çeviriyoruz
    query_response = embedding_client.generate_embedding(query)
    query_vector = query_response.data[0].embedding

    # SQLite veritabanımıza bağlanıp kayıtlı dökümanları ve vektörlerini çekiyoruz
    conn = sqlite3.connect("knowledge_base.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, text, embedding FROM documents")
    rows = cursor.fetchall()

    results = []
    print("\n3. Veritabanındaki belgelerle soru karşılaştırılıyor...")
    for row in rows:
        doc_id = row[0]
        doc_text = row[1]
        # Veri tabanında yazı olarak sakladığımız vektörü tekrar sayı listesine çeviriyoruz
        doc_vector = json.loads(row[2])

        # Benzerlik puanını hesaplıyoruz
        score = cosine_similarity(query_vector, doc_vector)
        results.append((doc_text, score))
        print(f"-> Belge {doc_id} Benzerlik Skoru: %{score * 100:.2f} | '{doc_text[:35]}...'")

    conn.close()

    # Sonuçları benzerlik puanına göre en yüksekten en düşüğe sıralıyoruz
    results.sort(key=lambda x: x[1], reverse=True)

    print("\n--- EN ALAKALI BULUNAN BELGE ---")
    top_doc, top_score = results[0]
    print(f"Metin: {top_doc}")
    print(f"Benzerlik Puanı: %{top_score * 100:.2f}")
    print("---------------------------------\n")

except Exception as e:
    import traceback
    print("Bir hata oluştu:")
    traceback.print_exc()
