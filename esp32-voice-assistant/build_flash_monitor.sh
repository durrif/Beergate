#!/bin/bash
# Script rápido para compilar y flashear con ESP-IDF

cd ~/Documentos/PlatformIO/Projects/Esp32-S3-Box

# Exportar entorno ESP-IDF
source ~/.platformio/packages/framework-espidf/export.sh
export PATH=~/.platformio/packages/tool-cmake/bin:$PATH

# Compilar
echo "===== COMPILANDO ====="
idf.py build

if [ $? -eq 0 ]; then
    echo "===== FLASHEANDO ====="
    ~/.espressif/python_env/idf5.5_py3.12_env/bin/python \
        ~/.platformio/packages/framework-espidf/components/esptool_py/esptool/esptool.py \
        --chip esp32s3 -p /dev/ttyACM0 -b 460800 \
        --before default_reset --after hard_reset \
        write_flash --flash_mode dio --flash_size 2MB --flash_freq 80m \
        0x0 build/bootloader/bootloader.bin \
        0x8000 build/partition_table/partition-table.bin \
        0x10000 build/esp32s3_box_voice_assistant.bin
    
    if [ $? -eq 0 ]; then
        echo "===== MONITOR SERIAL ====="
        sleep 2
        ~/.espressif/python_env/idf5.5_py3.12_env/bin/python \
            ~/.espressif/python_env/idf5.5_py3.12_env/lib/python3.12/site-packages/esp_idf_monitor/idf_monitor.py \
            -p /dev/ttyACM0 -b 115200 \
            build/esp32s3_box_voice_assistant.elf
    fi
fi
