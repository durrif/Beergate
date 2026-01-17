#!/usr/bin/env python3
"""
Script para subir receta a Brewer's Friend usando Selenium
"""
import json
import time
import sys

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import Select
except ImportError:
    print("❌ Error: Selenium no está instalado")
    print("   Instalando selenium...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'selenium'])
    print("✅ Selenium instalado. Ejecuta el script de nuevo.")
    sys.exit(0)

# Credenciales
USERNAME = "durrif@gmail.com"
PASSWORD = "4431Durr$"

# Cargar receta
with open('data/my_recipes.json', 'r') as f:
    recipes = json.load(f)
    recipe = recipes[0]  # Primera receta (Valsaín Hazy IPA)

print(f"📝 Subiendo receta: {recipe['name']}")
print(f"   Estilo: {recipe['style']}")
print(f"   ABV: {recipe['abv']}% | IBU: {recipe['ibu']} | Volumen: {recipe['batch_size']}L")

# Configurar Chrome en modo headless
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--window-size=1920,1080')
chrome_options.add_argument('user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36')

print("\n🌐 Iniciando navegador...")
try:
    driver = webdriver.Chrome(options=chrome_options)
except Exception as e:
    print(f"❌ Error iniciando Chrome: {e}")
    print("   Intentando con Firefox...")
    try:
        from selenium.webdriver.firefox.options import Options as FirefoxOptions
        firefox_options = FirefoxOptions()
        firefox_options.add_argument('--headless')
        driver = webdriver.Firefox(options=firefox_options)
    except Exception as e2:
        print(f"❌ Error iniciando Firefox: {e2}")
        print("\n💡 Instala Chrome o Firefox, o chromedriver:")
        print("   sudo apt install chromium-chromedriver")
        print("   o descarga de: https://chromedriver.chromium.org/")
        sys.exit(1)

try:
    # 1. Login
    print("\n🔐 Iniciando sesión en Brewer's Friend...")
    driver.get('https://www.brewersfriend.com/login/')
    
    # Esperar y llenar formulario
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "email"))
    )
    
    driver.find_element(By.NAME, "email").send_keys(USERNAME)
    driver.find_element(By.NAME, "password").send_keys(PASSWORD)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    # Esperar a que cargue dashboard
    time.sleep(3)
    
    if 'login' in driver.current_url:
        print("❌ Error en login - credenciales incorrectas o CAPTCHA")
        driver.quit()
        sys.exit(1)
    
    print("✅ Login exitoso!")    
    print("✅ Login exitoso!")
    
    # 2. Ir a crear receta
    print("\n📋 Creando nueva receta...")
    driver.get('https://www.brewersfriend.com/homebrew/recipe/new')
    time.sleep(2)
    
    # Llenar datos básicos
    driver.find_element(By.NAME, "name").send_keys(recipe['name'])
    
    # Seleccionar estilo
    try:
        style_select = Select(driver.find_element(By.NAME, "style"))
        style_select.select_by_visible_text(recipe['style'])
    except:
        print(f"   ⚠️ Estilo '{recipe['style']}' no encontrado, usando el primero")
    
    # Tipo All Grain
    try:
        type_select = Select(driver.find_element(By.NAME, "type"))
        type_select.select_by_visible_text("All Grain")
    except:
        pass
    
    # Volumen, OG, FG, etc
    driver.find_element(By.NAME, "batch_size").clear()
    driver.find_element(By.NAME, "batch_size").send_keys(str(recipe['batch_size']))
    
    driver.find_element(By.NAME, "boil_time").clear()
    driver.find_element(By.NAME, "boil_time").send_keys(str(recipe['boil_time']))
    
    driver.find_element(By.NAME, "efficiency").clear()
    driver.find_element(By.NAME, "efficiency").send_keys("75")
    
    print(f"   ✓ Datos básicos llenados")
    
    # 3. Añadir maltas
    print(f"   📦 Añadiendo {len(recipe['malts'])} maltas...")
    for i, malt in enumerate(recipe['malts']):
        # Click en "Add Fermentable"
        try:
            driver.find_element(By.ID, "add-fermentable").click()
            time.sleep(0.5)
        except:
            pass
        
        # Llenar datos de malta
        driver.find_element(By.NAME, f"fermentable[{i}][name]").send_keys(malt['name'])
        driver.find_element(By.NAME, f"fermentable[{i}][amount]").send_keys(str(malt['amount_kg']))
        
        # Unidad kg
        try:
            unit_select = Select(driver.find_element(By.NAME, f"fermentable[{i}][unit]"))
            unit_select.select_by_value("kg")
        except:
            pass
    
    print(f"   ✓ Maltas añadidas")
    
    # 4. Añadir lúpulos
    print(f"   🌿 Añadiendo {len(recipe['hops'])} lúpulos...")
    for i, hop in enumerate(recipe['hops']):
        try:
            driver.find_element(By.ID, "add-hop").click()
            time.sleep(0.5)
        except:
            pass
        
        driver.find_element(By.NAME, f"hop[{i}][name]").send_keys(hop['name'])
        driver.find_element(By.NAME, f"hop[{i}][amount]").send_keys(str(hop['amount_g']))
        driver.find_element(By.NAME, f"hop[{i}][time]").send_keys(str(max(0, hop['time_min'])))
        driver.find_element(By.NAME, f"hop[{i}][aa]").send_keys(str(hop.get('aa', 10)))
        
        # Uso del lúpulo
        try:
            use_select = Select(driver.find_element(By.NAME, f"hop[{i}][use]"))
            use_select.select_by_value(hop['use'])
        except:
            pass
    
    print(f"   ✓ Lúpulos añadidos")
    
    # 5. Añadir levadura
    if recipe.get('yeast'):
        print(f"   🧫 Añadiendo levadura...")
        try:
            driver.find_element(By.ID, "add-yeast").click()
            time.sleep(0.5)
        except:
            pass
        
        driver.find_element(By.NAME, "yeast[0][name]").send_keys(recipe['yeast']['name'])
        driver.find_element(By.NAME, "yeast[0][attenuation]").send_keys(str(recipe['yeast'].get('attenuation', 75)))
        print(f"   ✓ Levadura añadida")
    
    # 6. Añadir notas
    if recipe.get('notes'):
        try:
            driver.find_element(By.NAME, "notes").send_keys(recipe['notes'])
        except:
            pass
    
    # 7. Guardar receta
    print("\n🚀 Guardando receta...")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(3)
    
    # Obtener URL final
    final_url = driver.current_url
    
    if 'recipe/view' in final_url or 'recipe/edit' in final_url:
        print(f"\n✅ ¡Receta creada exitosamente!")
        print(f"🔗 URL: {final_url}")
        
        # Guardar URL en el archivo
        recipe['url'] = final_url
        with open('data/my_recipes.json', 'w') as f:
            json.dump(recipes, f, indent=2)
        print("📝 URL guardada en my_recipes.json")
    else:
        print(f"\n⚠️ Receta guardada pero URL no confirmada")
        print(f"   URL actual: {final_url}")
        print(f"   Verifica en: https://www.brewersfriend.com/homebrew/recipe/")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    
finally:
    driver.quit()
    print("\n✨ Proceso completado")

