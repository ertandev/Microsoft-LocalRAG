import sqlite3
import json
import math
import openai
from foundry_local_sdk import Configuration, FoundryLocalManager

# Benzerlik fonksiyonumuz
def cosine_similarity(v1, v2):
    dot_product = sum(x * y for x, y in zip(v1, v2))
    norm_v1 = math.sqrt(sum(x * x for x in v1))
    norm_v2 = math.sqrt(sum(x * x for x in v2))
    if not norm_v1 or not norm_v2:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

try:
    print("1. RAG Sistemi başlatılıyor...")
    config = Configuration(app_name="local_rag_app")
    FoundryLocalManager.initialize(config)
    manager = FoundryLocalManager.instance

    # 1. Her iki modeli de yüklüyoruz (Embedding ve Chat modelleri)
    print("Modeller yükleniyor...")
    
    # Arama yapacak olan model
    embed_model = manager.catalog.get_model("qwen3-embedding-8b")
    embed_model.load()
    embedding_client = embed_model.get_embedding_client()

    # Soruyu cevaplayacak olan model
    chat_alias = "phi-3.5-mini"
    chat_model = manager.catalog.get_model(chat_alias)
    chat_model.load()

    # 2. Yerel Web Servisini Başlatıyoruz (Chat modelimizle konuşmak için)
    print("Yerel web servisi başlatılıyor...")
    manager.start_web_service()
    local_url = manager.urls[0]

    # OpenAI istemcisini yerel sunucuya bağlıyoruz
    client = openai.OpenAI(
        base_url=f"{local_url}/v1",
        api_key="local-key"
    )

    # Kullanıcının sorduğu soru
    user_query = "Stajyerler projelerini hangi ortamda ve nasıl geliştiriyorlar?"
    print(f"\nSoru: {user_query}")

    # 3. SORUYU VEKTÖRE ÇEVİRİP VERİ TABANINDA SEMANTİK ARAMA YAPIYORUZ
    print("Veri tabanında arama yapılıyor...")
    query_vector = embedding_client.generate_embedding(user_query).data[0].embedding

    conn = sqlite3.connect("knowledge_base.db")
    cursor = conn.cursor()
    cursor.execute("SELECT text, embedding FROM documents")
    rows = cursor.fetchall()

    results = []
    for row in rows:
        doc_text = row[0]
        doc_vector = json.loads(row[1])
        score = cosine_similarity(query_vector, doc_vector)
        results.append((doc_text, score))
    
    conn.close()

    # En alakalı dökümanı buluyoruz
    results.sort(key=lambda x: x[1], reverse=True)
    en_alakali_metin = results[0][0]
    print(f"Bulunan en alakalı kaynak metin: '{en_alakali_metin}'")

    # 4. YAPAY ZEKAYA ŞABLON (PROMPT) HAZIRLIYORUZ
    # Modele rolünü ve uyması gereken kuralları sistem talimatıyla (System Prompt) veriyoruz
    system_prompt = (
        "Sen bilgili ve yardımsever bir asistansın.\n"
        "Sana aşağıda verilen 'KAYNAK METİN'e bağlı kalarak kullanıcının sorusunu yanıtla.\n"
        "Kurallar:\n"
        "1. Sadece verilen kaynak metindeki bilgileri kullan.\n"
        "2. Kaynak metinde olmayan hiçbir şeyi uydurma.\n"
        "3. Türkçe kurallarına uygun, düzgün ve akıcı cevap ver.\n\n"
        f"KAYNAK METİN:\ {en_alakali_metin}"
    )

    print("\nYapay zekadan cevap üretiliyor...")
    response = client.chat.completions.create(
        model=chat_alias,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        temperature=0.3 # Daha az uydurma yapması ve kaynak metne sadık kalması için düşük sıcaklık seçiyoruz
    )

    print("\n================ RAG CEVABI ================")
    print(response.choices[0].message.content)
    print("============================================\n")

    # Temizlik
    manager.stop_web_service()

except Exception as e:
    import traceback
    print("Bir hata oluştu:")
    traceback.print_exc()
