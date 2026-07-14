from foundry_local_sdk import Configuration, FoundryLocalManager
from foundry_local_sdk.logging_helper import LogLevel

try:
    print("Foundry Local SDK initialization...")
    config = Configuration(app_name="local_rag_app", log_level=LogLevel.WARNING)
    FoundryLocalManager.initialize(config)
    manager = FoundryLocalManager.instance
    
    print("Listing models in catalog:")
    models = manager.catalog.list_models()
    if not models:
        print("No models found in the catalog.")
    for m in models:
        print(f"Model Alias: {m.alias}")
        for v in m.variants:
            print(f"  - Variant ID: {v.id}, Type: {v.info.model_type}")
except Exception as e:
    import traceback
    print("An error occurred:")
    traceback.print_exc()
