import openai
from foundry_local_sdk import Configuration, FoundryLocalManager

try:
    print("1. Foundry Local başlatılıyor...")
    config = Configuration(app_name="local_rag_app")
    FoundryLocalManager.initialize(config)
    manager = FoundryLocalManager.instance

    # Kullanacağımız modeli seçiyoruz
    model_alias = "phi-3.5-mini"
    model = manager.catalog.get_model(model_alias)
    
    # Model indirilmemişse indiriyoruz
    if not model.is_cached:
        print(f"2. {model_alias} modeli indiriliyor (Bu işlem internet hızınıza bağlı olarak birkaç dakika sürebilir)...")
        model.download(progress_callback=lambda pct: print(f"İndirme Durumu: {pct:.1f}%", end="\r"))
        print("\nİndirme tamamlandı!")
    else:
        print(f"2. {model_alias} zaten bilgisayarda kayıtlı.")
        
    print(f"Model hafızaya yükleniyor...")
    # Modeli hafızaya yüklüyoruz
    loaded_model = model.load()

    print("3. Yerel web servisi başlatılıyor...")
    manager.start_web_service()
    
    # Yerel sunucu adresini alıyoruz
    local_url = manager.urls[0]
    print(f"Yerel sunucu aktif: {local_url}")

    # OpenAI kütüphanesini yerel sunucumuza yönlendiriyoruz
    client = openai.OpenAI(
        base_url=f"{local_url}/v1",
        api_key="local-key"  # Yerelde çalıştığı için anahtarın ne olduğu önemsiz
    )

    print("\n4. Yapay zekaya soru soruluyor...")
    response = client.chat.completions.create(
        model=model_alias,
        messages=[
            {"role": "system", "content": "Sen yardımsever bir asistansın. Türkçe cevap ver."},
            {"role": "user", "content": "Yapay zeka nedir? Sadece 1 cümle ile açıkla."}
        ]
    )

    print("\n--- ROBOTUN CEVABI ---")
    print(response.choices[0].message.content)
    print("----------------------\n")

    # Temizlik: Web servisini kapatıyoruz
    manager.stop_web_service()
    
except Exception as e:
    import traceback
    print("Bir hata oluştu:")
    traceback.print_exc()
