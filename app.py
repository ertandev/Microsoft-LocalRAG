import streamlit as st
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

# Streamlit'in modeli her etkileşimde sıfırdan yüklemesini önlemek için önbelleğe alıyoruz
@st.cache_resource
def get_foundry_resources():
    config = Configuration(app_name="local_rag_app")
    try:
        FoundryLocalManager.initialize(config)
    except Exception:
        # Zaten başlatılmışsa hata fırlatabilir, yoksayıyoruz
        pass
    
    manager = FoundryLocalManager.instance

    # Modelleri yüklüyoruz
    embed_model = manager.catalog.get_model("qwen3-embedding-0.6b")
    embed_model.load()
    
    chat_model = manager.catalog.get_model("phi-3.5-mini")
    chat_model.load()

    # Web servisini başlatıyoruz
    try:
        manager.start_web_service()
    except Exception:
        # Zaten çalışıyorsa yoksayıyoruz
        pass

    return manager, embed_model, chat_model

# Arayüz başlığı ve tasarımı
st.set_page_config(page_title="Yerel RAG Asistanı", page_icon="🤖", layout="wide")

st.title("🤖 Microsoft Foundry Local RAG Asistanı")
st.markdown("Bu uygulama tamamen bilgisayarınızda **offline** çalışmakta ve SQLite veritabanındaki bilgilere göre cevap üretmektedir.")

# Kaynakları yükle
with st.spinner("Modeller yükleniyor, lütfen bekleyin..."):
    manager, embed_model, chat_model = get_foundry_resources()
    embedding_client = embed_model.get_embedding_client()
    local_url = manager.urls[0]

# OpenAI istemcisi kurulumu
client = openai.OpenAI(
    base_url=f"{local_url}/v1",
    api_key="local-key"
)

# Sohbet geçmişini saklamak için Streamlit session state'i kullanıyoruz
if "messages" not in st.session_state:
    st.session_state.messages = []

# Yan tarafta veritabanı durumunu gösterelim
with st.sidebar:
    st.header("⚙️ Sistem Durumu")
    st.success("Embedding Model: qwen3-embedding-0.6b (YÜKLÜ)")
    st.success("Chat Model: phi-3.5-mini (YÜKLÜ)")
    st.info(f"Yerel API Sunucusu: {local_url}")
    
    st.markdown("---")
    st.subheader("📚 Veritabanındaki Mevcut Bilgiler")
    
    try:
        conn = sqlite3.connect("knowledge_base.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, text FROM documents")
        docs = cursor.fetchall()
        for doc in docs:
            st.markdown(f"**ID {doc[0]}:** {doc[1][:60]}...")
        conn.close()
    except Exception:
        st.warning("Veritabanı bulunamadı veya boş.")

# Geçmiş mesajları ekranda göster
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.write(message["content"])
        if "context" in message:
            with st.expander("🔍 Geri Alınan Kaynak Belge (RAG)"):
                st.info(message["context"])

# Kullanıcıdan girdi al
if user_question := st.chat_input("Sorunuzu buraya yazın..."):
    # Kullanıcı mesajını geçmişe ekle ve göster
    st.session_state.messages.append({"role": "user", "content": user_question})
    with st.chat_message("user"):
        st.write(user_question)

    # Cevap üretiliyor animasyonu
    with st.chat_message("assistant"):
        with st.spinner("Veritabanında aranıyor ve cevap üretiliyor..."):
            
            # 1. Sorunun vektörünü oluştur
            query_vector = embedding_client.generate_embedding(user_question).data[0].embedding

            # 2. SQLite'dan dökümanları çek ve karşılaştır
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

            if results:
                # En yüksek benzerlik skoruna göre sırala
                results.sort(key=lambda x: x[1], reverse=True)
                en_alakali_metin, en_yuksek_skor = results[0]
                
                # Eğer benzerlik çok düşükse (örneğin %15'in altı) alakasız sayabiliriz
                if en_yuksek_skor < 0.15:
                    en_alakali_metin = "Kullanıcının sorusuyla alakalı veritabanında hiçbir bilgi bulunamadı."
                    en_yuksek_skor = 0.0
            else:
                en_alakali_metin = "Veritabanı boş."
                en_yuksek_skor = 0.0

            # 3. Model için prompt hazırla
            system_prompt = (
                "Sen bilgili ve yardımsever bir asistansın.\n"
                "Sana aşağıda verilen 'KAYNAK METİN'e bağlı kalarak kullanıcının sorusunu yanıtla.\n"
                "Kurallar:\n"
                "1. Sadece verilen kaynak metindeki bilgileri kullan.\n"
                "2. Kaynak metinde olmayan hiçbir şeyi uydurma.\n"
                "3. Eğer kaynak metin yetersizse veya aranan bilgi yoksa, bunu kibarca belirt ve tahmin yürütme.\n"
                "4. Türkçe kurallarına uygun, düzgün ve akıcı cevap ver.\n\n"
                f"KAYNAK METİN:\n{en_alakali_metin}"
            )

            # 4. Yerel modele soruyu sor
            response = client.chat.completions.create(
                model="phi-3.5-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_question}
                ],
                temperature=0.3
            )
            
            answer = response.choices[0].message.content
            context_info = f"**Kaynak Belge:** {en_alakali_metin}\n\n**Benzerlik Skoru:** %{en_yuksek_skor * 100:.2f}"

            # Cevabı yazdır
            st.write(answer)
            with st.expander("🔍 Geri Alınan Kaynak Belge (RAG)"):
                st.info(context_info)

            # Geçmişe kaydet
            st.session_state.messages.append({
                "role": "assistant", 
                "content": answer,
                "context": context_info
            })
